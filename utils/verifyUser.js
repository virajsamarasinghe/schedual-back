import jwt from 'jsonwebtoken';
import { errorHandler } from './error.js';

export const verifyToken = (req, res, next) => {
  // Authorization header looks like: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(errorHandler(401, 'Unauthorized'));
  }

  const token = authHeader.split(' ')[1]; // Extract token part

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(errorHandler(401, 'Unauthorized'));
    }
    req.user = user; // attach decoded user info to req
    next();
  });
};
