import { withTransaction } from "../db/transaction.js";

export function withUnitOfWork(callback) {
  return withTransaction(callback);
}
