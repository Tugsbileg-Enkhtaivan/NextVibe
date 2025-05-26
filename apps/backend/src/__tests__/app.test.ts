import request from 'supertest';
import { app } from '../index'; 
import { describe, it, expect } from '@jest/globals';

describe('GET /', () => {
  it('should return 401 without auth', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(401);
  });
});