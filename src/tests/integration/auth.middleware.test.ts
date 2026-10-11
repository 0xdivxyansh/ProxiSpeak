import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, TestContext } from '../mocks/test-harness';

describe('Integration: Authentication Middleware', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestApp();
  });

  it('should reject request when Authorization header is missing', async () => {
    const res = await request(ctx.app).get('/api/v1/users/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toContain('Authorization header is missing');
  });

  it('should reject request when header format is not Bearer <token>', async () => {
    const res = await request(ctx.app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Basic dXNlcjpwYXNz');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toContain('Malformed Authorization header');
  });

  it('should reject request when Bearer token is empty', async () => {
    const res = await request(ctx.app).get('/api/v1/users/me').set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should accept valid authenticated token and provide user context', async () => {
    const res = await request(ctx.app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer mock-token-user123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.uid).toBe('user123');
  });

  it('should accept Firebase JWT via fallback claim extraction when running without service account', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        user_id: 'firebase_user_789',
        email: 'testuser@example.com',
        name: 'Test Explorer',
        email_verified: true,
      }),
    ).toString('base64url');
    const fakeJwt = `${header}.${payload}.mockSignature`;

    const res = await request(ctx.app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${fakeJwt}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.uid).toBe('firebase_user_789');
    expect(res.body.data.email).toBe('testuser@example.com');
  });

  it('should reject completely malformed or unverified token that has no valid JWT claims', async () => {
    const res = await request(ctx.app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer invalid_garbage_token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
