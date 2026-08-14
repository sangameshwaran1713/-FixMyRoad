import mongoose from 'mongoose';

/**
 * Sanitizes input queries and body objects against MongoDB operator injection ($gt, $ne, $where, etc.).
 */
export const sanitizeMongoOperators = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeMongoOperators);
  }

  const sanitized = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) {
      const error = new Error(`Invalid request parameter containing forbidden operator (${key})`);
      error.statusCode = 400;
      error.code = 'INVALID_QUERY_OPERATOR';
      throw error;
    }
    sanitized[key] = sanitizeMongoOperators(obj[key]);
  }

  return sanitized;
};

/**
 * Middleware to sanitize req.query and req.body against MongoDB operator injection.
 */
export const mongoSanitizerMiddleware = (req, res, next) => {
  try {
    if (req.query) req.query = sanitizeMongoOperators(req.query);
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeMongoOperators(req.body);
    }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Helper to validate MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware to validate pagination params (page >= 1, limit <= 100)
 */
export const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '10', 10);

  if (isNaN(page) || page < 1) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PAGE_PARAMETER',
      message: 'Page parameter must be a positive integer greater than or equal to 1',
    });
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_LIMIT_PARAMETER',
      message: 'Limit parameter must be an integer between 1 and 100',
    });
  }

  req.pagination = { page, limit, skip: (page - 1) * limit };
  next();
};
