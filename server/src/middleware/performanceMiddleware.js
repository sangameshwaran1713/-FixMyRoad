import { logger } from '../utils/logger.js';
import { metricsService } from '../services/metricsService.js';

/**
 * Performance middleware to log request duration, warn on slow requests (> 1000ms),
 * and record metrics into the central metricsService.
 */
export const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const slowThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD_MS || '1000', 10);

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    
    // Record in central metrics service
    metricsService.recordRequest(req, res, durationMs);

    const logData = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?._id || null,
      role: req.user?.role || null,
    };

    if (durationMs > slowThreshold) {
      logger.warn(`SLOW REQUEST ALERT: ${req.method} ${req.originalUrl} took ${durationMs}ms`, logData);
    }
  });

  next();
};
