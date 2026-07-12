import { config } from './env.js';

// Vercel gives every deployment its own subdomain, so preview URLs are matched
// with a pattern instead of being listed one by one in ALLOWED_ORIGINS.
const VERCEL_DEPLOYMENT = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

/**
 * Shared by Express and Socket.IO — they happen to take the same callback
 * signature, and having one rule means the REST API and the websocket can't
 * drift apart.
 */
export function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true); // curl, same-origin, health checks
  if (config.allowedOrigins.includes(origin)) return callback(null, true);
  if (VERCEL_DEPLOYMENT.test(origin)) return callback(null, true);

  callback(new Error(`Blocked by CORS: ${origin}`));
}
