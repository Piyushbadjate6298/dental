import { verifyToken } from '../services/authService.js';
import { sendError } from '../utils/response.js';

export function authMiddleware(req, res, next) {
  let token = null;

  // 1. Check cookies (HttpOnly cookie)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Check Authorization Bearer header
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return sendError(res, 'Authentication required. Please sign in.', 401);
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return sendError(res, 'Session expired or invalid token. Please sign in again.', 401);
  }

  req.user = decoded;
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(res, 'Forbidden: Admin access required.', 403);
  }
  next();
}
