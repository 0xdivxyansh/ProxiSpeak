import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, TestContext } from '../mocks/test-harness';

describe('Integration: Swagger OpenAPI Documentation', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestApp();
  });

  it('GET /api-docs.json should return valid OpenAPI 3.0 specification', async () => {
    const res = await request(ctx.app).get('/api-docs.json');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain('ProxiSpeak');
    expect(res.body.paths['/api/v1/health']).toBeDefined();
    expect(res.body.paths['/api/v1/audio/nearby']).toBeDefined();
    expect(res.body.paths['/api/v1/audio']).toBeDefined();
    expect(res.body.paths['/api/v1/users/me']).toBeDefined();
    expect(res.body.components.securitySchemes.bearerAuth).toBeDefined();
  });
});
