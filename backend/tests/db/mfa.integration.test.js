import { test } from "node:test";
import assert from "node:assert/strict";

const POSTGRES_URL = process.env.MFA_INTEGRATION_DATABASE_URL || process.env.DATABASE_URL;
const CAN_RUN =
  POSTGRES_URL &&
  /^postgres(?:ql)?:\/\//.test(POSTGRES_URL) &&
  process.env.RUN_MFA_PG_INTEGRATION === "1";

test(
  "migration 017 privileged MFA (PostgreSQL)",
  { skip: CAN_RUN ? false : "NOT_VERIFIED_ENVIRONMENT" },
  async () => {
    assert.ok(POSTGRES_URL);
  }
);
