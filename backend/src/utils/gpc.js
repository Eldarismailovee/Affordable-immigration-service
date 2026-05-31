export function isGpcSignalActive(req) {
  const header = req.headers["sec-gpc"];
  return header === "1" || header === 1;
}
