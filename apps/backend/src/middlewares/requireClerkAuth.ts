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
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.userId = userId;
  req.user = { id: userId };
  
  next();
};

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