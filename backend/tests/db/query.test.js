import { test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../../src/db/query.js";

test("query delegates to the provided database executor", async () => {
  const db = {
    query: async (text, params) => {
      assert.equal(text, "SELECT $1::int AS value");
      assert.deepEqual(params, [7]);
      return { rows: [{ value: 7 }], rowCount: 1 };
    },
  };

  const result = await query(db, "SELECT $1::int AS value", [7], {
    name: "query.test",
  });

  assert.deepEqual(result.rows, [{ value: 7 }]);
  assert.equal(result.rowCount, 1);
});

test("query rejects executors without a query method", async () => {
  await assert.rejects(
    query({}, "SELECT 1"),
    /Database executor must provide a query/
  );
});

test("query preserves database errors", async () => {
  const dbError = new Error("database failed");
  const db = {
    query: async () => {
      throw dbError;
    },
  };

  await assert.rejects(query(db, "SELECT 1"), (error) => error === dbError);
});
