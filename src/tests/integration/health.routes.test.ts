import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, TestContext } from '../mocks/test-harness';

describe('Integration: Health Routes', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestApp();
  });

  it('GET /api/v1/health should return 200 OK with health status and requestId', async () => {
    const res = await request(ctx.app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.version).toBe('1.0.0');
    expect(res.body.data.dependencies.firebase).toBeDefined();
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.body.requestId).toBeDefined();
  });

  it('GET /api/v1/unknown-route should return 404 with structured error response', async () => {
    const res = await request(ctx.app).get('/api/v1/non-existent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.requestId).toBeDefined();
  });
});
