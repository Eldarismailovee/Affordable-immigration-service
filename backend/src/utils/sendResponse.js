export function sendResponse(res, schema, payload, statusCode = 200) {
  const data = schema.parse(payload);
  return res.status(statusCode).json(data);
}
