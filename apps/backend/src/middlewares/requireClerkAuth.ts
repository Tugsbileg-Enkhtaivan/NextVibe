import { Request, Response, NextFunction } from 'express';
import { getAuth, clerkClient } from '@clerk/express';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
      userId?: string;
    }
  }
}

const logDev = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

export const requireClerkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== requireClerkAuth middleware ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Authorization header:', req.headers.authorization ? 
      `Bearer ${req.headers.authorization.substring(7, 27)}...` : 'Missing');
    console.log('Cookies present:', Object.keys(req.cookies || {}).length > 0);
    
    const { userId, sessionId, getToken } = getAuth(req);
    
    console.log('Clerk auth result:', { 
      userId: userId || 'null', 
      sessionId: sessionId ? 'Present' : 'Missing',
      hasGetToken: typeof getToken === 'function'
    });

    if (userId) {
      req.userId = userId;
      req.user = { id: userId };
      console.log('✅ Authentication successful:', userId);
      return next();
    }

    console.log('❌ Authentication failed - no userId from getAuth');
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required. Please sign in.',
      debug: process.env.NODE_ENV === 'development' ? {
        hasUserId: !!userId,
        hasSessionId: !!sessionId,
        hasAuthHeader: !!req.headers.authorization,
        cookieCount: Object.keys(req.cookies || {}).length
      } : undefined
    });
    return;

  } catch (error: any) {
    console.error('❌ Auth middleware error:', {
      message: error.message,
      name: error.name,
      url: req.url
    });
    
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication error'
    });
    return;
  }
};

export const optionalClerkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    logDev('=== optionalClerkAuth middleware ===');
    
    const { userId } = getAuth(req);
    
    if (userId) {
      req.userId = userId;
      req.user = { id: userId };
      logDev('ℹ️ Optional auth success:', userId);
    } else {
      logDev('ℹ️ No authentication found (optional)');
    }

    next();
  } catch (error: any) {
    logDev('⚠️ Optional auth middleware error:', error.message);
    // Continue anyway since this is optional
    next();
  }
};

// export const requireRole = (allowedRoles: string[]) => {
//   return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     try {
//       if (!req.userId) {
//         res.status(401).json({ error: 'Unauthorized', message: 'Login required' });
//         return;
//       }

//       // Use clerkClient to get user with roles
//       const user = await clerkClient.users.getUser(req.userId);
//       const userRoles = user.organizationMemberships?.map(org => org.role) || [];
      
//       const hasRole = allowedRoles.some(role => userRoles.includes(role));
//       if (!hasRole) {
//         res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
//         return;
//       }

//       next();
//     } catch (error: any) {
//       console.error('Role check error:', error.message);
//       res.status(500).json({ error: 'Internal Server Error', message: 'Role check failed' });
//     }
//   };
// };