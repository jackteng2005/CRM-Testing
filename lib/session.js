import jwt from 'jsonwebtoken';

export const SESSION_COOKIE = 'session';
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signSession(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifySession(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
