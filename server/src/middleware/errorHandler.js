import { logger } from '../utils/logger.js';

/**
 * Standardized Centralized Express Error Handler
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const requestId = req.requestId || null;

  // Log structured error
  logger.error(err.message || 'Internal Server Error', {
    requestId,
    statusCode,
    code: errorCode,
    path: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  const responsePayload = {
    success: false,
    code: errorCode,
    message: err.message || 'Internal Server Error',
    requestId,
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};

/**
 * 404 Route Not Found Handler
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Requested endpoint does not exist: ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};
