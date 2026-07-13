/**
 * A small in-memory rate limiter.
 *
 * It's a factory, not a single middleware, because the two things worth
 * protecting have different budgets: Groq's free tier allows roughly 30
 * requests/minute, while Wandbox and Piston have their own (undocumented)
 * patience. Each limiter gets its own tally, so a burst of Run clicks can't
 * starve the AI chat.
 *
 * In memory means it resets on restart and doesn't work across multiple server
 * instances. Fine for one Render dyno; swap in Redis if this ever scales.
 */
export function rateLimiter({ max, windowMs = 60_000 }) {
  const hits = new Map(); // ip -> { count, resetAt }

  // Housekeeping: drop expired entries so the Map can't grow forever.
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (now > entry.resetAt) hits.delete(ip);
    }
  }, windowMs).unref();

  return function limit(req, res, next) {
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
  };
}
