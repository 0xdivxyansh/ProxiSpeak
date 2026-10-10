import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, TestContext } from '../mocks/test-harness';

describe('Integration: Audio Upload Lifecycle and Management', () => {
  let ctx: TestContext;
  const ownerToken = 'Bearer mock-token-audioCreator1';
  const otherUserToken = 'Bearer mock-token-otherUser2';

  beforeEach(() => {
    ctx = createTestApp();
  });

  const validAudioPayload = {
    title: 'Market Street Street Musicians',
    description: 'Acoustic guitar performance outside Powell Station.',
    latitude: 37.7844,
    longitude: -122.408,
    visibility: 'public',
    declaredMimeType: 'audio/mpeg',
    declaredSizeBytes: 4194304, // 4MB
  };

  describe('POST /api/v1/audio (Initiate Upload Session)', () => {
    it('should create pending audio record and return signed upload URL', async () => {
      const res = await request(ctx.app)
        .post('/api/v1/audio')
        .set('Authorization', ownerToken)
        .send(validAudioPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.audioId).toBeDefined();
      expect(res.body.data.uploadUrl).toBeDefined();
      expect(res.body.data.uploadMethod).toBe('PUT');
      expect(res.body.data.storagePath).toContain('audioCreator1');
      expect(res.body.data.expiresAt).toBeDefined();

      // Verify record in repository is in pending_upload state
      const saved = await ctx.audioRepo.findById(res.body.data.audioId);
      expect(saved).not.toBeNull();
      expect(saved?.status).toBe('pending_upload');
      expect(saved?.ownerUid).toBe('audioCreator1');
    });

    it('should fail with 401 when unauthenticated', async () => {
      const res = await request(ctx.app).post('/api/v1/audio').send(validAudioPayload);
      expect(res.status).toBe(401);
    });

    it('should fail with 400 validation error when title is missing', async () => {
      const invalid = { ...validAudioPayload };
      delete (invalid as Record<string, unknown>).title;

      const res = await request(ctx.app)
        .post('/api/v1/audio')
        .set('Authorization', ownerToken)
        .send(invalid);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with 400 when MIME type is unsupported', async () => {
      const res = await request(ctx.app)
        .post('/api/v1/audio')
        .set('Authorization', ownerToken)
        .send({ ...validAudioPayload, declaredMimeType: 'video/mp4' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/audio/:id/complete (Finalize and Publish)', () => {
    let audioId: string;
    let storagePath: string;

    beforeEach(async () => {
      const initRes = await request(ctx.app)
        .post('/api/v1/audio')
        .set('Authorization', ownerToken)
        .send(validAudioPayload);

      audioId = initRes.body.data.audioId;
      storagePath = initRes.body.data.storagePath;
    });

    it('should reject completion if file does not exist in storage', async () => {
      const res = await request(ctx.app)
        .post(`/api/v1/audio/${audioId}/complete`)
        .set('Authorization', ownerToken);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('not found in storage');
    });

    it('should reject completion by a different user with 403 Forbidden', async () => {
      // Simulate file upload
      ctx.storageService.mockUpload(storagePath, 4194304, 'audio/mpeg');

      const res = await request(ctx.app)
        .post(`/api/v1/audio/${audioId}/complete`)
        .set('Authorization', otherUserToken);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should successfully publish audio after verifying storage asset', async () => {
      // Simulate successful binary upload by client to storage
      ctx.storageService.mockUpload(storagePath, 4194304, 'audio/mpeg');

      const res = await request(ctx.app)
        .post(`/api/v1/audio/${audioId}/complete`)
        .set('Authorization', ownerToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('published');

      // Verify idempotency: repeated complete returns published state without error
      const repeatRes = await request(ctx.app)
        .post(`/api/v1/audio/${audioId}/complete`)
        .set('Authorization', ownerToken);

      expect(repeatRes.status).toBe(200);
      expect(repeatRes.body.data.status).toBe('published');
    });
  });

  describe('GET /api/v1/audio/:id/playback (Playback URL Generation)', () => {
    let publicAudioId: string;
    let privateAudioId: string;

    beforeEach(async () => {
      // Create and publish public audio
      const pubInit = await request(ctx.app)
        .post('/api/v1/audio')
        .set('Authorization', ownerToken)
        .send({ ...validAudioPayload, visibility: 'public' });
      publicAudioId = pubInit.body.data.audioId;
      ctx.storageService.mockUpload(pubInit.body.data.storagePath, 4000000, 'audio/mpeg');
      await request(ctx.app)
        .post(`/api/v1/audio/${publicAudioId}/complete`)
        .set('Authorization', ownerToken);

      // Create and publish private audio
      const privInit = await request(ctx.app)
        .post('/api/v1/audio')
        .set('Authorization', ownerToken)
        .send({ ...validAudioPayload, visibility: 'private' });
      privateAudioId = privInit.body.data.audioId;
      ctx.storageService.mockUpload(privInit.body.data.storagePath, 4000000, 'audio/mpeg');
      await request(ctx.app)
        .post(`/api/v1/audio/${privateAudioId}/complete`)
        .set('Authorization', ownerToken);
    });

    it('should allow public access to public published audio playback', async () => {
      const res = await request(ctx.app).get(`/api/v1/audio/${publicAudioId}/playback`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.playbackUrl).toBeDefined();
      expect(res.body.data.expiresAt).toBeDefined();
    });

    it('should reject unauthenticated access to private recording playback with 403', async () => {
      const res = await request(ctx.app).get(`/api/v1/audio/${privateAudioId}/playback`);
      expect(res.status).toBe(403);
    });

    it('should reject non-owner access to private recording playback with 403', async () => {
      const res = await request(ctx.app)
        .get(`/api/v1/audio/${privateAudioId}/playback`)
        .set('Authorization', otherUserToken);
      expect(res.status).toBe(403);
    });

    it('should allow owner access to private recording playback', async () => {
      const res = await request(ctx.app)
        .get(`/api/v1/audio/${privateAudioId}/playback`)
        .set('Authorization', ownerToken);

      expect(res.status).toBe(200);
      expect(res.body.data.playbackUrl).toBeDefined();
    });
  });

  describe('PATCH & DELETE /api/v1/audio/:id (Update and Delete)', () => {
    let audioId: string;
    let storagePath: string;

    beforeEach(async () => {
      const init = await request(ctx.app)
        .post('/api/v1/audio')
        .set('Authorization', ownerToken)
        .send(validAudioPayload);
      audioId = init.body.data.audioId;
      storagePath = init.body.data.storagePath;
      ctx.storageService.mockUpload(storagePath, 4000000, 'audio/mpeg');
      await request(ctx.app)
        .post(`/api/v1/audio/${audioId}/complete`)
        .set('Authorization', ownerToken);
    });

    it('should allow owner to update metadata and recalculate geohash on coordinate change', async () => {
      const original = await ctx.audioRepo.findById(audioId);
      const originalGeohash = original?.geohash;

      const res = await request(ctx.app)
        .patch(`/api/v1/audio/${audioId}`)
        .set('Authorization', ownerToken)
        .send({
          title: 'Updated Market St Audio',
          latitude: 37.79,
          longitude: -122.4,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Market St Audio');
      expect(res.body.data.geohash).not.toBe(originalGeohash);
    });

    it('should reject update by non-owner with 403 Forbidden', async () => {
      const res = await request(ctx.app)
        .patch(`/api/v1/audio/${audioId}`)
        .set('Authorization', otherUserToken)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
    });

    it('should allow owner to delete audio and remove storage file', async () => {
      const res = await request(ctx.app)
        .delete(`/api/v1/audio/${audioId}`)
        .set('Authorization', ownerToken);

      expect(res.status).toBe(200);

      // Verify removed from repository
      const doc = await ctx.audioRepo.findById(audioId);
      expect(doc).toBeNull();

      // Verify removed from storage
      const meta = await ctx.storageService.getFileMetadata(storagePath);
      expect(meta).toBeNull();
    });

    it('should reject delete by non-owner with 403 Forbidden', async () => {
      const res = await request(ctx.app)
        .delete(`/api/v1/audio/${audioId}`)
        .set('Authorization', otherUserToken);

      expect(res.status).toBe(403);
    });
  });
});
