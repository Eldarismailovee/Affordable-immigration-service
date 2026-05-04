import { AppError } from "../utils/appError.js";

export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404, "ROUTE_NOT_FOUND"));
}
