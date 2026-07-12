import { verifyToken } from '../services/token.js';

/** Blocks the request unless it carries a valid `Authorization: Bearer <jwt>`. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'unauthorized', message: 'Sign in to continue.' });
  }

  req.user = { id: payload.sub, username: payload.username, color: payload.color };
  next();
}
