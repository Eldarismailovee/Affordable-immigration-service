import { AppError } from "../utils/appError.js";

export function validateRequest(schema) {
  return (req, _res, next) => {
    const isBodyOnlySchema = typeof schema.safeParse === "function";
    const schemas = isBodyOnlySchema ? { body: schema } : schema;
    const parsedValues = {};
    const errors = [];

    for (const [source, sourceSchema] of Object.entries(schemas)) {
      const result = sourceSchema.safeParse(req[source]);

      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            path:
              isBodyOnlySchema && source === "body"
                ? issue.path.join(".")
                : [source, ...issue.path].join("."),
            message: issue.message,
          }))
        );
        continue;
      }

      parsedValues[source] = result.data;
    }

    if (errors.length > 0) {
      const error = new AppError("Validation failed", 400, "VALIDATION_FAILED");
      error.details = errors;
      next(error);
      return;
    }

    for (const [source, value] of Object.entries(parsedValues)) {
      req[source] = value;
    }

    next();
  };
}
