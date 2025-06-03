// webhooks/clerkWebhook.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Webhook } from 'svix';

const prisma = new PrismaClient();

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData;
  object: string;
}

interface ClerkUserData {
  id: string;
  email_addresses: Array<{
    id: string;
    email_address: string;
  }>;
  primary_email_address_id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export const handleClerkWebhook = async (req: Request, res: Response) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET');
  }

  const headers = req.headers;
  const payload = req.body;

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkWebhookEvent;
  
  try {
    evt = wh.verify(payload, {
      'svix-id': headers['svix-id'] as string,
      'svix-timestamp': headers['svix-timestamp'] as string,
      'svix-signature': headers['svix-signature'] as string,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { type, data } = evt;

  try {
    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      default:
        console.log(`Unhandled event type: ${type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const handleUserCreated = async (userData: ClerkUserData) => {
  const { id, email_addresses, username, first_name, last_name } = userData;
  
  const primaryEmail = email_addresses.find((email) => email.id === userData.primary_email_address_id);
  
  try {
    await prisma.user.create({
      data: {
        id,
        email: primaryEmail?.email_address || `${id}@noemail.com`,
        username: username || `user_${id.substring(0, 8)}`,
      }
    });
    console.log(`User created in database: ${id}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`User ${id} already exists in database`);
    } else {
      throw error;
    }
  }
};

const handleUserUpdated = async (userData: ClerkUserData) => {
  const { id, email_addresses, username, first_name, last_name } = userData;
  
  const primaryEmail = email_addresses.find((email) => email.id === userData.primary_email_address_id);
  
  try {
    await prisma.user.upsert({
      where: { id },
      update: {
        email: primaryEmail?.email_address || `${id}@noemail.com`,
        username: username || `user_${id.substring(0, 8)}`,
      },
      create: {
        id,
        email: primaryEmail?.email_address || `${id}@noemail.com`,
        username: username || `user_${id.substring(0, 8)}`,
      }
    });
    console.log(`User updated in database: ${id}`);
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
  }
};

const handleUserDeleted = async (userData: ClerkUserData) => {
  const { id } = userData;
  
  try {
    await prisma.user.delete({
      where: { id }
    });
    console.log(`User deleted from database: ${id}`);
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
  }
};