import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import pool from "../../src/db/pool.js";
import { runMigrations } from "../../src/db/migrate.js";
import { query } from "../../src/db/query.js";
import {
  completeIdempotencyRecord,
  deleteExpiredIdempotencyRecords,
  insertIdempotencyProcessing,
  findIdempotencyRecordForUpdate,
  reacquireIdempotencyRecord,
} from "../../src/repositories/idempotency.repository.js";
import { withTransaction } from "../../src/db/transaction.js";
import { fingerprintIdempotencyKey } from "../../src/config/idempotency.js";
import { IDEMPOTENCY_STATES } from "../../src/constants/idempotency.js";

const POSTGRES_URL =
  process.env.IDEMPOTENCY_INTEGRATION_DATABASE_URL || process.env.DATABASE_URL;
const CAN_RUN =
  POSTGRES_URL &&
  /^postgres(?:ql)?:\/\//.test(POSTGRES_URL) &&
  process.env.RUN_IDEMPOTENCY_PG_INTEGRATION === "1";

async function tableExists(name) {
  const { rows } = await query(
    pool,
    "SELECT to_regclass($1) AS table_name",
    [`public.${name}`],
    { name: "idempotency.integration.table-exists" }
  );

  return Boolean(rows[0]?.table_name);
}

test(
  "migration 019 idempotency records (PostgreSQL)",
  { skip: CAN_RUN ? false : "NOT_VERIFIED_ENVIRONMENT" },
  async (t) => {
    process.env.IDEMPOTENCY_KEY_HMAC_SECRET =
      process.env.IDEMPOTENCY_KEY_HMAC_SECRET || "test-idempotency-hmac-secret-value-32b";

    await runMigrations();
    assert.ok(await tableExists("idempotency_records"));

    await t.test("unique scope constraint prevents duplicate keys", async () => {
      const actorScope = `user:${randomUUID()}`;
      const operation = "intake.create";
      const keyHash = fingerprintIdempotencyKey(randomUUID());
      const requestHash = randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 86_400_000);

      const first = await insertIdempotencyProcessing({
        actorScope,
        operation,
        idempotencyKeyHash: keyHash,
        requestHash,
        expiresAt,
      });

      const second = await insertIdempotencyProcessing({
        actorScope,
        operation,
        idempotencyKeyHash: keyHash,
        requestHash,
        expiresAt,
      });

      assert.ok(first);
      assert.equal(second, null);
    });

    await t.test("atomic insert + complete in one transaction", async () => {
      const actorScope = `user:${randomUUID()}`;
      const operation = "dsar.create";
      const keyHash = fingerprintIdempotencyKey(randomUUID());
      const requestHash = randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 86_400_000);

      const result = await withTransaction(async (client) => {
        const inserted = await insertIdempotencyProcessing(
          {
            actorScope,
            operation,
            idempotencyKeyHash: keyHash,
            requestHash,
            expiresAt,
          },
          client
        );

        assert.ok(inserted);

        return completeIdempotencyRecord(
          {
            id: inserted.id,
            resourceType: "dsar_request",
            resourceId: randomUUID(),
            httpStatus: 201,
            responseBody: { id: "safe-id" },
            expiresAt,
          },
          client
        );
      });

      assert.equal(result.state, IDEMPOTENCY_STATES.COMPLETED);
      assert.equal(result.httpStatus, 201);
    });

    await t.test("transaction rollback removes processing record", async () => {
      const actorScope = `user:${randomUUID()}`;
      const operation = "payment.hosted_url.set";
      const keyHash = fingerprintIdempotencyKey(randomUUID());
      const requestHash = randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 86_400_000);

      await assert.rejects(async () => {
        await withTransaction(async (client) => {
          await insertIdempotencyProcessing(
            {
              actorScope,
              operation,
              idempotencyKeyHash: keyHash,
              requestHash,
              expiresAt,
            },
            client
          );

          throw new Error("forced rollback");
        });
      });

      const { rows } = await query(
        pool,
        `
        SELECT *
        FROM idempotency_records
        WHERE actor_scope = $1
          AND operation = $2
          AND idempotency_key_hash = $3
        `,
        [actorScope, operation, keyHash],
        { name: "idempotency.integration.rollback-check" }
      );

      assert.equal(rows.length, 0);
    });

    await t.test("concurrent same-key inserts yield one row", async () => {
      const actorScope = `user:${randomUUID()}`;
      const operation = "intake.create";
      const sharedKey = randomUUID();
      const keyHash = fingerprintIdempotencyKey(sharedKey);
      const requestHash = randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 86_400_000);

      const attempts = await Promise.all(
        Array.from({ length: 8 }, () =>
          insertIdempotencyProcessing({
            actorScope,
            operation,
            idempotencyKeyHash: keyHash,
            requestHash,
            expiresAt,
          })
        )
      );

      const winners = attempts.filter(Boolean);
      assert.equal(winners.length, 1);

      const { rows } = await query(
        pool,
        `
        SELECT COUNT(*)::int AS count
        FROM idempotency_records
        WHERE actor_scope = $1
          AND operation = $2
          AND idempotency_key_hash = $3
        `,
        [actorScope, operation, keyHash],
        { name: "idempotency.integration.concurrent-count" }
      );

      assert.equal(rows[0].count, 1);
    });

    await t.test("failed retryable record can be reacquired", async () => {
      const actorScope = `admin:${randomUUID()}`;
      const operation = "admin.user.role.change";
      const keyHash = fingerprintIdempotencyKey(randomUUID());
      const requestHash = randomUUID().replace(/-/g, "");
      const expiresAt = new Date(Date.now() + 86_400_000);

      const inserted = await insertIdempotencyProcessing({
        actorScope,
        operation,
        idempotencyKeyHash: keyHash,
        requestHash,
        expiresAt,
      });

      await query(
        pool,
        `
        UPDATE idempotency_records
        SET state = $2
        WHERE id = $1
        `,
        [inserted.id, IDEMPOTENCY_STATES.FAILED_RETRYABLE],
        { name: "idempotency.integration.mark-retryable" }
      );

      const reacquired = await reacquireIdempotencyRecord({
        id: inserted.id,
        requestHash,
        expiresAt,
      });

      assert.equal(reacquired.state, IDEMPOTENCY_STATES.PROCESSING);
    });

    await t.test("cleanup deletes only expired terminal records", async () => {
      const actorScope = `user:${randomUUID()}`;
      const operation = "dsar.anonymize";
      const keyHash = fingerprintIdempotencyKey(randomUUID());
      const requestHash = randomUUID().replace(/-/g, "");
      const expiredAt = new Date(Date.now() - 60_000);

      const inserted = await insertIdempotencyProcessing({
        actorScope,
        operation,
        idempotencyKeyHash: keyHash,
        requestHash,
        expiresAt: expiredAt,
      });

      await completeIdempotencyRecord({
        id: inserted.id,
        resourceType: "dsar_request",
        resourceId: randomUUID(),
        httpStatus: 200,
        responseBody: { ok: true },
        expiresAt: expiredAt,
      });

      const deleted = await deleteExpiredIdempotencyRecords({
        limit: 100,
        now: new Date(),
      });

      assert.ok(deleted.includes(inserted.id));

      const locked = await insertIdempotencyProcessing({
        actorScope: `user:${randomUUID()}`,
        operation: "intake.create",
        idempotencyKeyHash: fingerprintIdempotencyKey(randomUUID()),
        requestHash: randomUUID().replace(/-/g, ""),
        expiresAt: new Date(Date.now() + 86_400_000),
      });

      const processing = await findIdempotencyRecordForUpdate({
        actorScope: locked.actorScope,
        operation: locked.operation,
        idempotencyKeyHash: locked.idempotencyKeyHash,
      });

      assert.equal(processing.state, IDEMPOTENCY_STATES.PROCESSING);
    });
  }
);

after(async () => {
  if (CAN_RUN) {
    await pool.end();
  }
});
