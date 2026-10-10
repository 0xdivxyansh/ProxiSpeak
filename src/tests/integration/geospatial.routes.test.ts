import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, TestContext } from '../mocks/test-harness';
import { AudioRecording } from '../../modules/audio/audio.model';

describe('Integration: Geospatial Audio Discovery Engine', () => {
  let ctx: TestContext;

  // Reference query center: San Francisco Union Square (37.7879, -122.4075)
  const centerLat = 37.7879;
  const centerLng = -122.4075;

  beforeEach(async () => {
    ctx = createTestApp();

    // Seed test recordings:
    // Recording 1: SF Chinatown (~600m from Union Square)
    const rec1: AudioRecording = {
      id: 'rec-chinatown-1',
      ownerUid: 'user-sf-guide',
      title: 'Chinatown Market Bells',
      description: 'Morning sounds at Portsmouth Square',
      storagePath: 'audio/user-sf-guide/rec1.mp3',
      latitude: 37.7946,
      longitude: -122.4058,
      geohash: ctx.geoService.encodeGeohash({ latitude: 37.7946, longitude: -122.4058 }),
      mimeType: 'audio/mpeg',
      sizeBytes: 1024000,
      durationSeconds: 45,
      status: 'published',
      visibility: 'public',
      createdAt: '2026-10-10T08:00:00.000Z',
      updatedAt: '2026-10-10T08:00:00.000Z',
    };

    // Recording 2: SF Ferry Building (~1.6km from Union Square)
    const rec2: AudioRecording = {
      id: 'rec-ferry-2',
      ownerUid: 'user-sf-guide',
      title: 'Ferry Horns & Waves',
      description: 'Embarcadero ferry arrivals',
      storagePath: 'audio/user-sf-guide/rec2.mp3',
      latitude: 37.7955,
      longitude: -122.3937,
      geohash: ctx.geoService.encodeGeohash({ latitude: 37.7955, longitude: -122.3937 }),
      mimeType: 'audio/mpeg',
      sizeBytes: 2048000,
      durationSeconds: 90,
      status: 'published',
      visibility: 'public',
      createdAt: '2026-10-10T08:30:00.000Z',
      updatedAt: '2026-10-10T08:30:00.000Z',
    };

    // Recording 3: Golden Gate Park (~5.5km from Union Square)
    const rec3: AudioRecording = {
      id: 'rec-ggp-3',
      ownerUid: 'user-park-ranger',
      title: 'Golden Gate Park Conservatory',
      description: 'Bison paddock and garden ambience',
      storagePath: 'audio/user-park-ranger/rec3.mp3',
      latitude: 37.7715,
      longitude: -122.4687,
      geohash: ctx.geoService.encodeGeohash({ latitude: 37.7715, longitude: -122.4687 }),
      mimeType: 'audio/mpeg',
      sizeBytes: 3000000,
      durationSeconds: 120,
      status: 'published',
      visibility: 'public',
      createdAt: '2026-10-10T09:00:00.000Z',
      updatedAt: '2026-10-10T09:00:00.000Z',
    };

    // Recording 4: Unpublished pending upload in Chinatown (must NOT appear)
    const rec4Pending: AudioRecording = {
      id: 'rec-pending-4',
      ownerUid: 'user-sf-guide',
      title: 'Unpublished Draft Sound',
      description: 'Still uploading',
      storagePath: 'audio/user-sf-guide/rec4.mp3',
      latitude: 37.7946,
      longitude: -122.4058,
      geohash: ctx.geoService.encodeGeohash({ latitude: 37.7946, longitude: -122.4058 }),
      mimeType: 'audio/mpeg',
      sizeBytes: 1024000,
      durationSeconds: null,
      status: 'pending_upload',
      visibility: 'public',
      createdAt: '2026-10-10T09:10:00.000Z',
      updatedAt: '2026-10-10T09:10:00.000Z',
    };

    // Recording 5: Private recording in Chinatown (must NOT appear in public discovery)
    const rec5Private: AudioRecording = {
      id: 'rec-private-5',
      ownerUid: 'user-sf-guide',
      title: 'Secret Personal Note',
      description: 'Private memory',
      storagePath: 'audio/user-sf-guide/rec5.mp3',
      latitude: 37.7946,
      longitude: -122.4058,
      geohash: ctx.geoService.encodeGeohash({ latitude: 37.7946, longitude: -122.4058 }),
      mimeType: 'audio/mpeg',
      sizeBytes: 1024000,
      durationSeconds: 30,
      status: 'published',
      visibility: 'private',
      createdAt: '2026-10-10T09:20:00.000Z',
      updatedAt: '2026-10-10T09:20:00.000Z',
    };

    await ctx.audioRepo.create(rec1);
    await ctx.audioRepo.create(rec2);
    await ctx.audioRepo.create(rec3);
    await ctx.audioRepo.create(rec4Pending);
    await ctx.audioRepo.create(rec5Private);
  });

  it('should return recordings within 2km radius sorted by distance ascending', async () => {
    const res = await request(ctx.app).get(
      `/api/v1/audio/nearby?lat=${centerLat}&lng=${centerLng}&radius=2000`,
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const results = res.body.data.results;
    // rec1 (Chinatown ~750m) and rec2 (Ferry Building ~1600m) should be included
    // rec3 (Golden Gate Park ~5.5km) should be excluded
    // rec4 (pending) and rec5 (private) should be excluded
    expect(results.length).toBe(2);

    expect(results[0].id).toBe('rec-chinatown-1');
    expect(results[1].id).toBe('rec-ferry-2');

    // Verify distance ascending order
    expect(results[0].distanceMeters).toBeLessThan(results[1].distanceMeters);
    expect(results[0].distanceMeters).toBeGreaterThan(0);
    expect(results[0].distanceMeters).toBeLessThan(1000);
    expect(results[1].distanceMeters).toBeGreaterThan(1000);
    expect(results[1].distanceMeters).toBeLessThan(2000);
  });

  it('should include recordings farther away when radius is expanded to 6km', async () => {
    const res = await request(ctx.app).get(
      `/api/v1/audio/nearby?lat=${centerLat}&lng=${centerLng}&radius=6000`,
    );

    expect(res.status).toBe(200);
    expect(res.body.data.results.length).toBe(3);
    expect(res.body.data.results[2].id).toBe('rec-ggp-3');
    expect(res.body.data.results[2].distanceMeters).toBeGreaterThan(5000);
  });

  it('should return empty results array when no recordings are within radius', async () => {
    // Search in Pacific Ocean where no audio exists
    const res = await request(ctx.app).get(`/api/v1/audio/nearby?lat=0.0&lng=-150.0&radius=1000`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results).toEqual([]);
    expect(res.body.data.pagination.total).toBe(0);
    expect(res.body.data.pagination.hasMore).toBe(false);
  });

  it('should reject invalid coordinates with 400 Validation Error', async () => {
    const resBadLat = await request(ctx.app).get(`/api/v1/audio/nearby?lat=95.0&lng=0&radius=1000`);
    expect(resBadLat.status).toBe(400);
    expect(resBadLat.body.error.code).toBe('VALIDATION_ERROR');

    const resBadLng = await request(ctx.app).get(
      `/api/v1/audio/nearby?lat=0&lng=200.0&radius=1000`,
    );
    expect(resBadLng.status).toBe(400);
    expect(resBadLng.body.error.code).toBe('VALIDATION_ERROR');

    const resMissing = await request(ctx.app).get(`/api/v1/audio/nearby?radius=1000`);
    expect(resMissing.status).toBe(400);
    expect(resMissing.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject non-positive radius or exceeding maximum configured radius', async () => {
    const resZero = await request(ctx.app).get(
      `/api/v1/audio/nearby?lat=37.7879&lng=-122.4075&radius=0`,
    );
    expect(resZero.status).toBe(400);

    const resExcessive = await request(ctx.app).get(
      `/api/v1/audio/nearby?lat=37.7879&lng=-122.4075&radius=100000`, // 100km > 50km
    );
    expect(resExcessive.status).toBe(400);
  });

  it('should paginate results properly with limit and cursor', async () => {
    // Request page with limit=1
    const page1Res = await request(ctx.app).get(
      `/api/v1/audio/nearby?lat=${centerLat}&lng=${centerLng}&radius=6000&limit=1`,
    );

    expect(page1Res.status).toBe(200);
    expect(page1Res.body.data.results.length).toBe(1);
    expect(page1Res.body.data.results[0].id).toBe('rec-chinatown-1');
    expect(page1Res.body.data.pagination.hasMore).toBe(true);
    expect(page1Res.body.data.pagination.nextCursor).not.toBeNull();

    const cursor = page1Res.body.data.pagination.nextCursor;

    // Fetch page 2 using cursor
    const page2Res = await request(ctx.app).get(
      `/api/v1/audio/nearby?lat=${centerLat}&lng=${centerLng}&radius=6000&limit=1&cursor=${encodeURIComponent(
        cursor,
      )}`,
    );

    expect(page2Res.status).toBe(200);
    expect(page2Res.body.data.results.length).toBe(1);
    expect(page2Res.body.data.results[0].id).toBe('rec-ferry-2');
  });
});
