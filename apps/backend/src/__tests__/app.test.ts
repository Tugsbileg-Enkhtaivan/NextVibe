import request from 'supertest';
import {app} from '../index'; 
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /', () => {
  it('should return 401 without auth', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(401);
  });
});
