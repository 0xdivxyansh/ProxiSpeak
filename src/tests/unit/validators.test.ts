import { describe, it, expect } from 'vitest';
import { nearbyAudioQuerySchema } from '../../modules/geospatial/geospatial.validator';
import { createAudioSchema, updateAudioSchema } from '../../modules/audio/audio.validator';
import { updateUserProfileSchema } from '../../modules/users/user.validator';

describe('Zod Validators', () => {
  describe('nearbyAudioQuerySchema', () => {
    it('should successfully parse valid query parameters', () => {
      const result = nearbyAudioQuerySchema.safeParse({
        lat: '37.7749',
        lng: '-122.4194',
        radius: '3000',
        limit: '15',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lat).toBe(37.7749);
        expect(result.data.lng).toBe(-122.4194);
        expect(result.data.radius).toBe(3000);
        expect(result.data.limit).toBe(15);
      }
    });

    it('should reject latitude out of bounds', () => {
      expect(nearbyAudioQuerySchema.safeParse({ lat: 95, lng: 0 }).success).toBe(false);
      expect(nearbyAudioQuerySchema.safeParse({ lat: -95, lng: 0 }).success).toBe(false);
      expect(nearbyAudioQuerySchema.safeParse({ lat: 'not-a-number', lng: 0 }).success).toBe(false);
    });

    it('should reject longitude out of bounds', () => {
      expect(nearbyAudioQuerySchema.safeParse({ lat: 0, lng: 185 }).success).toBe(false);
      expect(nearbyAudioQuerySchema.safeParse({ lat: 0, lng: -185 }).success).toBe(false);
    });

    it('should reject non-positive or excessive radius', () => {
      expect(nearbyAudioQuerySchema.safeParse({ lat: 0, lng: 0, radius: 0 }).success).toBe(false);
      expect(nearbyAudioQuerySchema.safeParse({ lat: 0, lng: 0, radius: -50 }).success).toBe(false);
      expect(nearbyAudioQuerySchema.safeParse({ lat: 0, lng: 0, radius: 60000 }).success).toBe(
        false,
      );
    });
  });

  describe('createAudioSchema', () => {
    const validAudioPayload = {
      title: 'Valid Recording Title',
      description: 'Audio notes at park',
      latitude: 40.7128,
      longitude: -74.006,
      visibility: 'public',
      declaredMimeType: 'audio/mpeg',
      declaredSizeBytes: 2048576,
    };

    it('should validate valid audio creation payload', () => {
      const result = createAudioSchema.safeParse(validAudioPayload);
      expect(result.success).toBe(true);
    });

    it('should reject missing or empty title', () => {
      expect(createAudioSchema.safeParse({ ...validAudioPayload, title: '' }).success).toBe(false);
      const withoutTitle = { ...validAudioPayload };
      delete (withoutTitle as Record<string, unknown>).title;
      expect(createAudioSchema.safeParse(withoutTitle).success).toBe(false);
    });

    it('should reject unsupported MIME types', () => {
      expect(
        createAudioSchema.safeParse({ ...validAudioPayload, declaredMimeType: 'application/pdf' })
          .success,
      ).toBe(false);
      expect(
        createAudioSchema.safeParse({ ...validAudioPayload, declaredMimeType: 'image/jpeg' })
          .success,
      ).toBe(false);
    });

    it('should reject file size exceeding configured limit', () => {
      expect(
        createAudioSchema.safeParse({
          ...validAudioPayload,
          declaredSizeBytes: 25 * 1024 * 1024, // 25MB > 10MB limit
        }).success,
      ).toBe(false);
    });

    it('should reject unauthorized fields (strict mode / mass assignment protection)', () => {
      const payloadWithInjectedRole = {
        ...validAudioPayload,
        status: 'published',
        role: 'admin',
      };
      expect(createAudioSchema.safeParse(payloadWithInjectedRole).success).toBe(false);
    });
  });

  describe('updateAudioSchema', () => {
    it('should allow updating permitted fields (title, coordinates, description, visibility)', () => {
      const validUpdate = {
        title: 'New Title',
        description: 'New Description',
        visibility: 'private',
        latitude: 37.7749,
        longitude: -122.4194,
      };
      const result = updateAudioSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('should reject updating immutable fields (id, ownerUid, storagePath)', () => {
      const invalidUpdate = {
        title: 'New Title',
        ownerUid: 'injected_owner',
      };
      const result = updateAudioSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserProfileSchema', () => {
    it('should validate permitted displayName update', () => {
      const result = updateUserProfileSchema.safeParse({ displayName: 'New Name' });
      expect(result.success).toBe(true);
    });

    it('should reject forbidden fields like uid or status', () => {
      const result = updateUserProfileSchema.safeParse({
        displayName: 'New Name',
        uid: 'hacked_uid',
      });
      expect(result.success).toBe(false);
    });
  });
});
