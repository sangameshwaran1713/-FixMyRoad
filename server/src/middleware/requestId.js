import { randomBytes } from 'crypto';

/**
 * Attaches a unique X-Request-ID header and property to incoming HTTP requests.
 */
export const requestIdMiddleware = (req, res, next) => {
  const existingId = req.headers['x-request-id'];

  // Reuse valid incoming request ID or generate a new fmr-xxxxxxxx ID
  const requestId = existingId && typeof existingId === 'string' && /^[a-zA-Z0-9_-]{8,64}$/.test(existingId)
    ? existingId
    : `fmr-${randomBytes(8).toString('hex')}`;

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
