const { ZodError } = require("zod");
const logger = require("../utils/logger");

const validate = (schema) => (req, res, next) => {
  try {
    // Parse forces the request to match the schema.
    // Zod's .parse() automatically strips out unknown properties if schema allows it.
    const validData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Replace request data with the sanitized, validated data
    req.body = validData.body;
    req.query = validData.query;
    req.params = validData.params;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Map Zod errors to a structured format: { field: "email", message: "Invalid email" }
      const formattedErrors = error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      // Log validation failures for analytics (security monitoring)
      logger.warn("Validation Error", { errors: formattedErrors, path: req.originalUrl });

      return res.status(400).json({
        status: "fail",
        message: "Invalid request data",
        errors: formattedErrors,
      });
    }
    next(error);
  }
};

module.exports = validate;