import User from '../models/User.js';
import { signToken } from '../services/token.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(req, res) {
  const username = String(req.body?.username ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (username.length < 3) return bad(res, 'Username needs at least 3 characters.');
  if (!EMAIL.test(email)) return bad(res, 'That email address does not look right.');
  if (password.length < 8) return bad(res, 'Password needs at least 8 characters.');

  // Check both fields so the message can say *which* one is taken.
  const clash = await User.findOne({ $or: [{ email }, { username }] });
  if (clash) {
    return bad(res, clash.email === email ? 'That email is already registered.' : 'That username is taken.');
  }

  const user = await User.create({
    username,
    email,
    passwordHash: await User.hashPassword(password),
  });

  res.status(201).json({ token: signToken(user), user: user.toPublic() });
}

export async function login(req, res) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  const user = await User.findOne({ email });

  // Deliberately the same message for "no such email" and "wrong password".
  // Saying which one was wrong tells an attacker which emails have accounts.
  if (!user || !(await user.checkPassword(password))) {
    return res.status(401).json({
      error: 'invalid_credentials',
      message: 'Email or password is incorrect.',
    });
  }

  res.json({ token: signToken(user), user: user.toPublic() });
}

/**
 * Lets the client ask "is the token in my localStorage still any good?" on page
 * load. A token is only a claim until the server agrees with it.
 */
export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: 'unauthorized', message: 'Sign in to continue.' });

  res.json({ user: user.toPublic() });
}

const bad = (res, message) => res.status(400).json({ error: 'bad_request', message });
