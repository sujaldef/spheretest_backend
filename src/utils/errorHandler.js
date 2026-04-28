/**
 * Centralized error utilities and middleware.
 */

/**
 * Wrap async route handlers to forward errors to Express.
 * @param {Function} fn
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 handler for unknown routes.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * General error handler.
 * Sends JSON error responses in a consistent shape.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
};

module.exports = {
  asyncHandler,
  notFound,
  errorHandler,
};

