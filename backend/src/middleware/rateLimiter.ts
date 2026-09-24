import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again in a minute.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 90,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Search query rate limit reached. Please slow down.',
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
    },
  },
});
