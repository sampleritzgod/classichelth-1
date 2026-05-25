/**
 * Global centralized error handling middleware.
 * Intercepts any thrown errors and sends a clean JSON response.
 */
const errorHandler = (err, req, res, next) => {
  // If the status code is still 200 (default), change it to 500 (internal server error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || "An unexpected error occurred",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
