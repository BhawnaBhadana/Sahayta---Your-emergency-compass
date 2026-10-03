import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Authentication required'));
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Requires one of roles: ${roles.join(', ')}`));
    }
    next();
  };
}
