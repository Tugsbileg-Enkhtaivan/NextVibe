import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

// Extend the Request interface to include user
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
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Set both userId and user.id for compatibility with different parts of your app
  req.userId = userId;
  req.user = { id: userId };
  
  next();
};

// Optional middleware for routes that can work with or without authentication
export const optionalClerkAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { userId } = getAuth(req);

  if (userId) {
    req.userId = userId;
    req.user = { id: userId };
  }
  
  next();
};