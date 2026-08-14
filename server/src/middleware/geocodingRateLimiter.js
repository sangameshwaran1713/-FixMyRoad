import rateLimit from 'express-rate-limit';

const maxGeocodes = parseInt(process.env.GEOCODING_RATE_LIMIT || '30', 10);
const windowMs = parseInt(process.env.GEOCODING_RATE_WINDOW_MS || '3600000', 10);

export const geocodingRateLimiter = rateLimit({
  windowMs,
  max: maxGeocodes,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Geocoding rate limit exceeded. Maximum ${maxGeocodes} requests per hour allowed. Please try again later.`,
  },
});
