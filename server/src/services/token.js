import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * The token carries just enough to identify you without a database round-trip
 * on every request: who you are, your display name, your caret colour.
 * Nothing secret, nothing that matters if it's stale.
 */
export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), username: user.username, color: user.color },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

/** Returns the payload, or null. Never throws — callers just check for null. */
export function verifyToken(token) {
  if (!token) return null;

  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null; // expired, tampered with, or signed by someone else
  }
}
