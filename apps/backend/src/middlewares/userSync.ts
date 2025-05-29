import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { auth, clerkClient } from '@clerk/express';

const prisma = new PrismaClient();

export const ensureUserExists = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId || userId === 'anonymous') {
      return next();
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      // Fetch user data from Clerk
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
        // Create minimal user record if Clerk fetch fails
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

// Alternative: Standalone function to sync user
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
      // User already exists (race condition)
      return await prisma.user.findUnique({ where: { id: userId } });
    }
    throw error;
  }
};