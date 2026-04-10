const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const { Prisma } = require("@prisma/client");

const handlePrismaError = (err) => {
  switch (err.code) {
    case "P2002": // Unique constraint failed
      const target = err.meta?.target || "Field";
      return new AppError(`Duplicate entry for ${target}. Please use another value!`, 400);
    case "P2025": // Record not found
      return new AppError("The requested record was not found.", 404);
    case "P2003": // Foreign key constraint failed
      return new AppError("Invalid reference. A related record does not exist.", 400);
    default:
      return new AppError(`Database Error: ${err.message}`, 400);
  }
};

const handleJWTError = () => new AppError("Invalid token. Please log in again!", 401);
const handleJWTExpiredError = () => new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err, req, res) => {
  logger.error(`[DEV ERROR] ${err.message}`, { stack: err.stack, path: req.originalUrl });
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    logger.error("💥 CRITICAL ERROR 💥", { error: err, path: req.originalUrl });
    res.status(500).json({
      status: "error",
      message: "Something went wrong on our end. We are looking into it."
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name; // Copy name explicitly

    // Translate 3rd party library errors into operational AppErrors
    if (err instanceof Prisma.PrismaClientKnownRequestError) error = handlePrismaError(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};