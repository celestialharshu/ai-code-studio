import { config } from '../config/env.js';

/**
 * A small in-memory rate limiter.
 *
 * Groq's free tier allows roughly 30 requests/minute. One runaway loop in the
 * frontend can burn that in seconds, so requests are capped here before they
 * ever reach Groq.
 *
 * In-memory means it resets on restart and doesn't work across multiple server
 * instances. That's fine for one Render dyno; swap in Redis if this ever scales.
 */
const hits = new Map(); // ip -> { count, resetAt }

export function rateLimiter(req, res, next) {
  const { windowMs, max } = config.rateLimit;
  const now = Date.now();
  const entry = hits.get(req.ip);

  // First request from this IP, or the previous window has expired.
  if (!entry || now > entry.resetAt) {
    hits.set(req.ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  entry.count += 1;

  if (entry.count > max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'rate_limited',
      message: `Too many requests. Try again in ${retryAfter}s.`,
    });
  }

  next();
}

// Housekeeping: drop expired entries so the Map can't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) {
    if (now > entry.resetAt) hits.delete(ip);
  }
}, 60_000).unref();
