import { randomUUID } from "crypto";

const HEADER = "x-request-id";
const MAX_LEN = 128;

export function requestId(req, res, next) {
  const incoming = req.get(HEADER);
  const id = incoming && incoming.length <= MAX_LEN ? incoming : randomUUID();

  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}
