import rateLimit from 'express-rate-limit';

const maxFeedback = parseInt(process.env.FEEDBACK_RATE_LIMIT || '20', 10);
const windowMs = parseInt(process.env.FEEDBACK_RATE_WINDOW_MS || '3600000', 10);

export const feedbackRateLimiter = rateLimit({
  windowMs,
  max: maxFeedback,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: `Feedback rate limit exceeded. Maximum ${maxFeedback} submissions per hour allowed.`,
  },
});
