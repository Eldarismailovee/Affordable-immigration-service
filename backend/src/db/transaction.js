import pool from "./pool.js";
import { query } from "./query.js";

export async function withTransaction(callback) {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await query(client, "BEGIN", [], { name: "transaction.begin" });
    transactionStarted = true;
    const result = await callback(client);
    await query(client, "COMMIT", [], { name: "transaction.commit" });
    return result;
  } catch (error) {
    if (transactionStarted) {
      try {
        await query(client, "ROLLBACK", [], { name: "transaction.rollback" });
      } catch (rollbackError) {
        error.rollbackError = rollbackError;
      }
    }

    throw error;
  } finally {
    client.release();
  }
}
