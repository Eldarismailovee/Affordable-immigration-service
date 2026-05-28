import pool from "./pool.js";

export function closeDatabasePool() {
  return pool.end();
}
