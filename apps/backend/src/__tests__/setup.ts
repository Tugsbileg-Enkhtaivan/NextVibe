import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Extend Jest timeout for database operations
jest.setTimeout(10000);

// Global cleanup for Prisma connections
const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});