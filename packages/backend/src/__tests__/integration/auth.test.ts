import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// @ts-ignore
import request from 'supertest';
import { app, cleanupDatabase, prismaTest } from '../helpers/setup.js';

describe('Auth Routes', () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  describe('POST /auth/send-otp', () => {
    it('should send OTP to a new student email', async () => {
      const response = await request(app)
        .post('/auth/send-otp')
        .send({
          email: 'student@example.com',
          role: 'STUDENT',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('OTP sent');
    });

    it('should send OTP to a parent email', async () => {
      const response = await request(app)
        .post('/auth/send-otp')
        .send({
          email: 'parent@example.com',
          role: 'PARENT',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('OTP sent');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/auth/send-otp')
        .send({
          email: 'invalid-email',
          role: 'STUDENT',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .post('/auth/send-otp')
        .send({
          email: 'test@example.com',
          role: 'INVALID_ROLE',
        });

      expect(response.status).toBe(400);
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/auth/send-otp')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/verify-otp', () => {
    beforeEach(async () => {
      // Send OTP first
      await request(app)
        .post('/auth/send-otp')
        .send({
          email: 'student@example.com',
          role: 'STUDENT',
        });
    });

    it('should verify OTP and return JWT token', async () => {
      const response = await request(app)
        .post('/auth/verify-otp')
        .send({
          email: 'student@example.com',
          otp: '123456', // Hardcoded OTP in MVP
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('student@example.com');
    });

    it('should create student profile on first login', async () => {
      await request(app)
        .post('/auth/verify-otp')
        .send({
          email: 'newstudent@example.com',
          otp: '123456',
        });

      const user = await prismaTest.user.findUnique({
        where: { email: 'newstudent@example.com' },
        include: { student: true },
      });

      expect(user).toBeDefined();
      expect(user?.role).toBe('STUDENT');
      expect(user?.student).toBeDefined();
    });

    it('should reject invalid OTP', async () => {
      const response = await request(app)
        .post('/auth/verify-otp')
        .send({
          email: 'student@example.com',
          otp: 'wrong-otp',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject non-existent email', async () => {
      const response = await request(app)
        .post('/auth/verify-otp')
        .send({
          email: 'nonexistent@example.com',
          otp: '123456',
        });

      expect(response.status).toBe(401);
    });

    it('should reject missing fields', async () => {
      const response = await request(app)
        .post('/auth/verify-otp')
        .send({
          email: 'student@example.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Get tokens first
      const sendResponse = await request(app)
        .post('/auth/send-otp')
        .send({
          email: 'student@example.com',
          role: 'STUDENT',
        });

      const verifyResponse = await request(app)
        .post('/auth/verify-otp')
        .send({
          email: 'student@example.com',
          otp: '123456',
        });

      refreshToken = verifyResponse.body.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create user and get token
      await request(app)
        .post('/auth/send-otp')
        .send({
          email: 'student@example.com',
          role: 'STUDENT',
        });

      const verifyResponse = await request(app)
        .post('/auth/verify-otp')
        .send({
          email: 'student@example.com',
          otp: '123456',
        });

      accessToken = verifyResponse.body.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('student@example.com');
      expect(response.body.role).toBe('STUDENT');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/auth/profile');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});
