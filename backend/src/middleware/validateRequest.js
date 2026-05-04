export function validateRequest(schema) {
  return (req, res, next) => {
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
      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    for (const [source, value] of Object.entries(parsedValues)) {
      req[source] = value;
    }

    next();
  };
}
