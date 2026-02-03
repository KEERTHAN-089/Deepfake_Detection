/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized error responses
 */

import ApiError from "../utils/ApiError";

/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
export const globalErrorHandler = (err, req, res, next) => {
  let error = err;

  // Convert non-ApiError errors to ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message);
  }

  const { statusCode, message, errors } = error;

  console.error('💥 Error:', {
    statusCode,
    message,
    errors,
    stack: error.stack
  });

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors
  });
};

/**
 * 404 Not Found middleware
 * Should be registered after all routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};
