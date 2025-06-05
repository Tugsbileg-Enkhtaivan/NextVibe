// requireClerkAuth.ts - Fixed middleware without Prisma

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
    console.log('Environment:', process.env.NODE_ENV);
    
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader ? 
      `Bearer ${authHeader.substring(7, 27)}...` : 'Missing');
    
    // Enhanced cookie debugging
    if (req.headers.cookie) {
      console.log('Raw cookie header present:', !!req.headers.cookie);
      logDev('Raw cookie header:', req.headers.cookie);
    }
    
    if (req.cookies) {
      const cookieKeys = Object.keys(req.cookies);
      console.log('Parsed cookies count:', cookieKeys.length);
      
      // Check for different Clerk cookie formats
      const clerkCookies = cookieKeys.filter(key => 
        key.includes('clerk') || key.includes('__session')
      );
      console.log('Clerk-related cookies:', clerkCookies);
      logDev('All cookie keys:', cookieKeys);
    }
    
    // Get auth from Clerk
    const { userId, sessionId, getToken } = getAuth(req);
    
    console.log('Clerk auth result:', { 
      userId: userId || 'null', 
      sessionId: sessionId ? 'Present' : 'Missing',
      hasGetToken: typeof getToken === 'function'
    });

    // If we have userId, verify with Clerk
    if (userId) {
      try {
        // Verify session if present
        if (sessionId) {
          console.log('🔍 Verifying session with Clerk...');
          const session = await clerkClient.sessions.getSession(sessionId);
          console.log('Session status:', session.status);
          
          if (session.status !== 'active') {
            console.log('❌ Session is not active:', session.status);
            res.status(401).json({ 
              error: 'Unauthorized', 
              message: 'Session expired. Please sign in again.',
              sessionStatus: session.status
            });
            return;
          }
        }
        
        // Verify user exists in Clerk
        console.log('🔍 Verifying user exists in Clerk...');
        const user = await clerkClient.users.getUser(userId);
        console.log('✅ User verified in Clerk:', user.id);
        
        // Set user info on request
        req.userId = userId;
        req.user = { id: userId };
        
        console.log('✅ Authentication successful:', userId);
        return next();
        
      } catch (clerkError: any) {
        console.log('❌ Clerk verification failed:', clerkError.message);
        
        // Check if it's a user not found error
        if (clerkError.status === 404) {
          res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'User not found. Please sign in again.',
          });
        } else {
          res.status(401).json({ 
            error: 'Unauthorized', 
            message: 'Authentication verification failed.',
            details: process.env.NODE_ENV === 'development' ? clerkError.message : undefined
          });
        }
        return;
      }
    }

    // No userId found
    console.log('❌ Authentication failed - no valid userId');
    
    const debugInfo = {
      hasUserId: !!userId,
      hasSessionId: !!sessionId,
      hasAuthHeader: !!req.headers.authorization,
      hasCookieHeader: !!req.headers.cookie,
      cookieCount: Object.keys(req.cookies || {}).length,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
      environment: process.env.NODE_ENV,
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ? 'Set' : 'Missing',
      clerkSecretKey: process.env.CLERK_SECRET_KEY ? 'Set' : 'Missing'
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      url: req.url
    });
    
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      try {
        // Optional: verify session for optional auth too
        if (sessionId) {
          const session = await clerkClient.sessions.getSession(sessionId);
          if (session.status === 'active') {
            req.userId = userId;
            req.user = { id: userId };
            logDev('ℹ️ Optional auth success:', userId);
          }
        } else {
          // No session but we have userId, still set it
          req.userId = userId;
          req.user = { id: userId };
          logDev('ℹ️ Optional auth success (no session):', userId);
        }
      } catch (sessionError) {
        logDev('⚠️ Optional session verification failed:', sessionError);
        // Don't set user if session is invalid
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
  console.log('🔍 Checking Clerk configuration...');
  
  const requiredEnvVars = [
    'CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];
  
  const envStatus = requiredEnvVars.map(envVar => ({
    name: envVar,
    present: !!process.env[envVar],
    value: process.env[envVar] ? `${process.env[envVar].substring(0, 20)}...` : 'Missing'
  }));
  
  console.log('Environment variables status:', envStatus);
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required Clerk environment variables:', missing);
    return false;
  }
  
  console.log('✅ Clerk configuration appears complete');
  return true;
};

// Health check endpoint for Clerk
export const clerkHealthCheck = async (req: Request, res: Response) => {
  try {
    const configCheck = checkClerkConfig();
    
    if (!configCheck) {
      return res.status(500).json({
        status: 'error',
        message: 'Clerk configuration incomplete'
      });
    }
    
    // Test Clerk connection
    try {
      const users = await clerkClient.users.getUserList({ limit: 1 });
      console.log('✅ Clerk API connection successful');
    } catch (clerkError: any) {
      console.error('❌ Clerk API connection failed:', clerkError.message);
      return res.status(500).json({
        status: 'error',
        message: 'Clerk API connection failed',
        error: clerkError.message
      });
    }
    
    res.json({
      status: 'ok',
      clerk: 'connected',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
};