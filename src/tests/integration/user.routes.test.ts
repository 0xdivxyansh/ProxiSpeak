import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, TestContext } from '../mocks/test-harness';

describe('Integration: User Routes', () => {
  let ctx: TestContext;
  const userToken = 'Bearer mock-token-explorer42';

  beforeEach(() => {
    ctx = createTestApp();
  });

  describe('GET /api/v1/users/me', () => {
    it('should retrieve or auto-provision current user profile', async () => {
      const res = await request(ctx.app).get('/api/v1/users/me').set('Authorization', userToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uid).toBe('explorer42');
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.createdAt).toBeDefined();
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should update user displayName successfully', async () => {
      const res = await request(ctx.app)
        .patch('/api/v1/users/me')
        .set('Authorization', userToken)
        .send({ displayName: 'Urban Acoustician' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe('Urban Acoustician');
      expect(res.body.data.uid).toBe('explorer42'); // UID remains unchanged
    });

    it('should reject invalid or empty displayName', async () => {
      const res = await request(ctx.app)
        .patch('/api/v1/users/me')
        .set('Authorization', userToken)
        .send({ displayName: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject modifications to protected fields (e.g. uid, status)', async () => {
      const res = await request(ctx.app)
        .patch('/api/v1/users/me')
        .set('Authorization', userToken)
        .send({ displayName: 'Valid Name', uid: 'injected_uid', status: 'admin' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
