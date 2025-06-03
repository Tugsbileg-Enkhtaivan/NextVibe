import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
      userId?: string;
    }
  }
}

export const requireClerkAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid authentication token is required'
      });
      return;
    }

    req.userId = userId;
    req.user = { id: userId };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token'
    });
  }
};

export const optionalClerkAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { userId } = getAuth(req);

    if (userId) {
      req.userId = userId;
      req.user = { id: userId };
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { has } = getAuth(req);

      if (!req.userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      const hasRequiredRole = allowedRoles.some(role => has && has({ role }));

      if (!hasRequiredRole) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking permissions'
      });
    }
  };
};
