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
    
    // Log all cookies for debugging
    if (req.cookies) {
      console.log('Available cookies:', Object.keys(req.cookies));
      console.log('Session cookie exists:', !!req.cookies.__session);
      console.log('Clerk session exists:', !!req.cookies.__clerk_db_jwt);
    }
    
    const { userId, sessionId, getToken } = getAuth(req);
    
    console.log('Clerk auth result:', { 
      userId: userId || 'null', 
      sessionId: sessionId ? 'Present' : 'Missing',
      hasGetToken: typeof getToken === 'function'
    });

    // Additional check for session validity
    if (userId && sessionId) {
      try {
        // Verify the session is still valid with Clerk
        const session = await clerkClient.sessions.getSession(sessionId);
        if (session.status !== 'active') {
          console.log('❌ Session is not active:', session.status);
          res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Session expired. Please sign in again.',
          });
          return 
        }
        
        req.userId = userId;
        req.user = { id: userId };
        console.log('✅ Authentication successful:', userId);
        return next();
      } catch (sessionError: any) {
        console.log('❌ Session verification failed:', sessionError.message);
        res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Invalid session. Please sign in again.',
        });
        return 
      }
    }

    if (userId) {
      req.userId = userId;
      req.user = { id: userId };
      console.log('✅ Authentication successful:', userId);
      return next();
    }

    console.log('❌ Authentication failed - no userId from getAuth');
    
    const debugInfo = {
      hasUserId: !!userId,
      hasSessionId: !!sessionId,
      hasAuthHeader: !!req.headers.authorization,
      cookieCount: Object.keys(req.cookies || {}).length,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer
    };
    
    console.log('Debug info:', debugInfo);
    
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required. Please sign in.',
      debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
    });
    return;

  } catch (error: any) {
    console.error('❌ Auth middleware error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
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
    
    const { userId, sessionId } = getAuth(req);
    
    if (userId) {
      // Optional: verify session for optional auth too
      if (sessionId) {
        try {
          const session = await clerkClient.sessions.getSession(sessionId);
          if (session.status === 'active') {
            req.userId = userId;
            req.user = { id: userId };
            logDev('ℹ️ Optional auth success:', userId);
          }
        } catch (sessionError) {
          logDev('⚠️ Optional session verification failed:', sessionError);
          // Don't set user if session is invalid
        }
      } else {
        req.userId = userId;
        req.user = { id: userId };
        logDev('ℹ️ Optional auth success (no session):', userId);
      }
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

// Utility function to check if Clerk is properly configured
export const checkClerkConfig = () => {
  const requiredEnvVars = [
    'CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required Clerk environment variables:', missing);
    return false;
  }
  
  console.log('✅ Clerk configuration appears complete');
  return true;
};