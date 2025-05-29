import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkClient, requireAuth } from '@clerk/express';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId?: string;
        sessionId?: string;
      };
    }
  }
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const ensureUserExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    
    if (!userId || userId === 'anonymous') {
      return next();
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        
        const primaryEmail = clerkUser.emailAddresses.find(
          email => email.id === clerkUser.primaryEmailAddressId
        );

        await prisma.user.create({
          data: {
            id: userId,
            email: primaryEmail?.emailAddress || `${userId}@noemail.com`,
            username: clerkUser.username || `user_${userId.substring(0, 8)}`,
          }
        });
        
        console.log(`User synced to database: ${userId}`);
      } catch (clerkError) {
        console.error('Error fetching user from Clerk:', clerkError);
        await prisma.user.create({
          data: {
            id: userId,
            email: `${userId}@noemail.com`,
            username: `user_${userId.substring(0, 8)}`,
          }
        }).catch(error => {
          if (error.code !== 'P2002') {
            console.error('Error creating minimal user:', error);
          }
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in ensureUserExists middleware:', error);
    next(); // Continue even if sync fails
  }
};

// Alternative: Using the custom interface approach
export const ensureUserExistsAlt = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId || userId === 'anonymous') {
      return next();
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        
        const primaryEmail = clerkUser.emailAddresses.find(
          email => email.id === clerkUser.primaryEmailAddressId
        );

        await prisma.user.create({
          data: {
            id: userId,
            email: primaryEmail?.emailAddress || `${userId}@noemail.com`,
            username: clerkUser.username || `user_${userId.substring(0, 8)}`,
          }
        });
        
        console.log(`User synced to database: ${userId}`);
      } catch (clerkError) {
        console.error('Error fetching user from Clerk:', clerkError);
        await prisma.user.create({
          data: {
            id: userId,
            email: `${userId}@noemail.com`,
            username: `user_${userId.substring(0, 8)}`,
          }
        }).catch(error => {
          if (error.code !== 'P2002') {
            console.error('Error creating minimal user:', error);
          }
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in ensureUserExists middleware:', error);
    next();
  }
};

export const syncUserToDatabase = async (userId: string) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (existingUser) {
      return existingUser;
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    
    const primaryEmail = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    );

    return await prisma.user.create({
      data: {
        id: userId,
        email: primaryEmail?.emailAddress || `${userId}@noemail.com`,
        username: clerkUser.username || `user_${userId.substring(0, 8)}`,
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return await prisma.user.findUnique({ where: { id: userId } });
    }
    throw error;
  }
};