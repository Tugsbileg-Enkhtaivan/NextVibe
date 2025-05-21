import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

export const requireClerkAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return; // stop execution here, but don't return the response itself
  }

  (req as any).userId = userId;
  next();
};
