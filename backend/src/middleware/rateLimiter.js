import { sendError } from '../utils/response.js';

// Sliding-window memory rate limiter for login and sensitive operations
const hitCounts = new Map();

export function rateLimiter({ windowMs = 15 * 60 * 1000, max = 15, message = 'Too many requests. Please try again later.' } = {}) {
  return (req, res, next) => {
    // Determine client IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.baseUrl || ''}${req.path}:${ip}`;
    const now = Date.now();

    // Clean up old entries
    if (hitCounts.size > 2000) {
      for (const [k, v] of hitCounts.entries()) {
        if (now - v.resetTime > 0) {
          hitCounts.delete(k);
        }
      }
    }

    const record = hitCounts.get(key);

    if (!record || now > record.resetTime) {
      hitCounts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    record.count += 1;

    if (record.count > max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return sendError(res, message, 429, { retryAfterSeconds: retryAfterSec });
    }

    next();
  };
}
