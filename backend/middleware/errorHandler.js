import { AppError } from "../utils/appError.js";

/**
 * Global centralized error handling middleware.
 * Intercepts any thrown errors and sends a clean JSON response.
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // 1. Mongoose Bad ObjectId Error
  if (err.name === "CastError") {
    const message = `Invalid resource identifier: ${err.value}`;
    error = new AppError(message, 400);
  }

  // 2. Mongoose Duplicate Key Error
  if (err.code === 11000) {
    // Use the modern driver's keyValue (errmsg is deprecated and may be absent).
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : null;
    const message = field
      ? `An account with that ${field} already exists. Please use another value.`
      : "Duplicate value. Please use another value.";
    error = new AppError(message, 400);
  }

  // 3. Mongoose Validation Error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data: ${errors.join(". ")}`;
    error = new AppError(message, 400);
  }

  // 4. JWT JsonWebTokenError
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid session token. Please log in again.", 401);
  }

  // 5. JWT TokenExpiredError
  if (err.name === "TokenExpiredError") {
    error = new AppError("Your session has expired. Please log in again.", 401);
  }

  const statusCode = error.statusCode || 500;
  const status = error.status || "error";

  res.status(statusCode).json({
    success: false,
    status,
    message: error.message || "An unexpected error occurred",
    stack: process.env.NODE_ENV === "production" ? null : error.stack,
  });
};

export default errorHandler;
