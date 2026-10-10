import crypto from 'crypto';
import { IAudioRepository, defaultAudioRepository } from './audio.repository';
import {
  IStorageService,
  defaultStorageService,
} from '../../infrastructure/storage/storage.service';
import { IUserRepository, defaultUserRepository } from '../users/user.repository';
import {
  GeospatialService,
  geospatialService as defaultGeoService,
} from '../geospatial/geospatial.service';
import {
  AudioRecording,
  CreateAudioInput,
  UpdateAudioInput,
  UploadSessionResponse,
  PlaybackResponse,
  NearbyAudioResult,
} from './audio.model';
import { NearbyAudioQueryParams } from '../geospatial/geospatial.validator';
import { PaginatedResult } from '../../common/types/common.types';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
} from '../../common/errors/app-error';
import { env } from '../../config/env';
import { logger } from '../../common/utils/logger';

function getFileExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/x-wav': 'wav',
    'audio/aac': 'aac',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
    'audio/flac': 'flac',
    'audio/m4a': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/mp4': 'mp4',
  };
  return map[mimeType.toLowerCase()] || 'audio';
}

export class AudioService {
  constructor(
    private audioRepo: IAudioRepository = defaultAudioRepository,
    private storageService: IStorageService = defaultStorageService,
    private userRepo: IUserRepository = defaultUserRepository,
    private geoService: GeospatialService = defaultGeoService,
  ) {}

  /**
   * Step A: Creates a pending audio upload record and returns a secure, time-limited upload URL.
   */
  async createUploadSession(
    ownerUid: string,
    input: CreateAudioInput,
  ): Promise<UploadSessionResponse> {
    const audioId = crypto.randomUUID();
    const extension = getFileExtension(input.declaredMimeType);
    const storagePath = `audio/${ownerUid}/${audioId}.${extension}`;

    const geohash = this.geoService.encodeGeohash({
      latitude: input.latitude,
      longitude: input.longitude,
    });

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + env.UPLOAD_URL_EXPIRY_SECONDS * 1000).toISOString();

    const newAudio: AudioRecording = {
      id: audioId,
      ownerUid,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      storagePath,
      latitude: input.latitude,
      longitude: input.longitude,
      geohash,
      mimeType: input.declaredMimeType.toLowerCase(),
      sizeBytes: input.declaredSizeBytes,
      durationSeconds: null,
      status: 'pending_upload',
      visibility: input.visibility || 'public',
      createdAt: now,
      updatedAt: now,
    };

    await this.audioRepo.create(newAudio);

    const uploadUrl = await this.storageService.generateSignedUploadUrl(
      storagePath,
      input.declaredMimeType,
      env.UPLOAD_URL_EXPIRY_SECONDS,
    );

    logger.info(`Audio upload session initiated`, { audioId, ownerUid, storagePath });

    return {
      audioId,
      storagePath,
      uploadUrl,
      uploadMethod: 'PUT',
      requiredHeaders: {
        'Content-Type': input.declaredMimeType,
      },
      expiresAt,
    };
  }

  /**
   * Step B: Verifies uploaded object in Cloud Storage and publishes the recording. Idempotent.
   */
  async completeUpload(audioId: string, ownerUid: string): Promise<AudioRecording> {
    const audio = await this.audioRepo.findById(audioId);
    if (!audio) {
      throw new NotFoundError(`Audio recording not found: ${audioId}`);
    }

    if (audio.ownerUid !== ownerUid) {
      throw new ForbiddenError('You do not have permission to finalize this audio upload.');
    }

    // Idempotent completion check
    if (audio.status === 'published') {
      logger.info(`Audio upload completion called idempotently for published record: ${audioId}`);
      return audio;
    }

    if (audio.status !== 'pending_upload') {
      throw new BadRequestError(
        `Cannot complete upload. Current audio status is '${audio.status}'.`,
      );
    }

    // Verify object existence in Cloud Storage
    const metadata = await this.storageService.getFileMetadata(audio.storagePath);
    if (!metadata || !metadata.exists) {
      throw new BadRequestError(
        'Upload verification failed: The audio file was not found in storage. Ensure the file has been uploaded before completing.',
      );
    }

    if (metadata.sizeBytes <= 0) {
      throw new BadRequestError('Upload verification failed: Uploaded file is empty (0 bytes).');
    }

    if (metadata.sizeBytes > env.MAX_AUDIO_FILE_SIZE_BYTES) {
      // Clean up oversized file from storage
      await this.storageService.deleteFile(audio.storagePath);
      await this.audioRepo.update(audioId, { status: 'failed' });
      throw new PayloadTooLargeError(
        `Uploaded file size (${metadata.sizeBytes} bytes) exceeds maximum limit of ${env.MAX_AUDIO_FILE_SIZE_BYTES} bytes.`,
      );
    }

    const updated = await this.audioRepo.update(audioId, {
      status: 'published',
      sizeBytes: metadata.sizeBytes,
      mimeType: metadata.contentType || audio.mimeType,
      updatedAt: new Date().toISOString(),
    });

    logger.info(`Audio recording verified and published successfully: ${audioId}`);
    return updated;
  }

  /**
   * Retrieves audio metadata by ID with visibility authorization checks.
   */
  async getAudioById(audioId: string, currentUid?: string): Promise<AudioRecording> {
    const audio = await this.audioRepo.findById(audioId);
    if (!audio || audio.status === 'deleted') {
      throw new NotFoundError(`Audio recording not found: ${audioId}`);
    }

    if (audio.visibility === 'private' && audio.ownerUid !== currentUid) {
      throw new ForbiddenError('This audio recording is private.');
    }

    return audio;
  }

  /**
   * Step C: Generates a short-lived secure signed URL for audio playback.
   */
  async getPlaybackUrl(audioId: string, currentUid?: string): Promise<PlaybackResponse> {
    const audio = await this.getAudioById(audioId, currentUid);

    if (audio.status !== 'published') {
      throw new BadRequestError(`Recording is not available for playback. Status: ${audio.status}`);
    }

    const playbackUrl = await this.storageService.generateSignedPlaybackUrl(
      audio.storagePath,
      env.PLAYBACK_URL_EXPIRY_SECONDS,
    );

    const expiresAt = new Date(Date.now() + env.PLAYBACK_URL_EXPIRY_SECONDS * 1000).toISOString();

    return {
      playbackUrl,
      mimeType: audio.mimeType,
      sizeBytes: audio.sizeBytes,
      durationSeconds: audio.durationSeconds,
      expiresAt,
    };
  }

  /**
   * Step D: Updates permitted audio metadata. Recalculates geohash if coordinates change.
   */
  async updateAudio(
    audioId: string,
    ownerUid: string,
    input: UpdateAudioInput,
  ): Promise<AudioRecording> {
    const audio = await this.audioRepo.findById(audioId);
    if (!audio || audio.status === 'deleted') {
      throw new NotFoundError(`Audio recording not found: ${audioId}`);
    }

    if (audio.ownerUid !== ownerUid) {
      throw new ForbiddenError('You do not have permission to modify this audio recording.');
    }

    const updatePayload: Partial<AudioRecording> = {};

    if (input.title !== undefined) {
      updatePayload.title = input.title.trim();
    }
    if (input.description !== undefined) {
      updatePayload.description = input.description.trim();
    }
    if (input.visibility !== undefined) {
      updatePayload.visibility = input.visibility;
    }

    // Check if coordinates updated
    const newLat = input.latitude !== undefined ? input.latitude : audio.latitude;
    const newLng = input.longitude !== undefined ? input.longitude : audio.longitude;

    if (input.latitude !== undefined || input.longitude !== undefined) {
      updatePayload.latitude = newLat;
      updatePayload.longitude = newLng;
      updatePayload.geohash = this.geoService.encodeGeohash({
        latitude: newLat,
        longitude: newLng,
      });
    }

    const updated = await this.audioRepo.update(audioId, updatePayload);
    logger.info(`Audio metadata updated for record: ${audioId}`);
    return updated;
  }

  /**
   * Step E: Deletes audio recording and removes storage file.
   */
  async deleteAudio(audioId: string, ownerUid: string): Promise<void> {
    const audio = await this.audioRepo.findById(audioId);
    if (!audio || audio.status === 'deleted') {
      throw new NotFoundError(`Audio recording not found: ${audioId}`);
    }

    if (audio.ownerUid !== ownerUid) {
      throw new ForbiddenError('You do not have permission to delete this audio recording.');
    }

    // Step 1: Update status to deleting to prevent new discovery/playback
    await this.audioRepo.update(audioId, { status: 'deleting' });

    // Step 2: Delete storage file safely
    await this.storageService.deleteFile(audio.storagePath);

    // Step 3: Remove document from repository
    await this.audioRepo.delete(audioId);

    logger.info(`Audio recording and storage asset deleted: ${audioId}`);
  }

  /**
   * Geospatial Discovery: Queries candidate records in geohash bounds, filters by exact distance,
   * sorts by proximity, and returns paginated results.
   */
  async discoverNearby(
    params: NearbyAudioQueryParams,
  ): Promise<PaginatedResult<NearbyAudioResult>> {
    const center = { latitude: params.lat, longitude: params.lng };
    const radiusMeters = params.radius;
    const limit = params.limit;

    // 1. Calculate geohash query bounds
    const bounds = this.geoService.getQueryBounds(center, radiusMeters);

    // 2. Fetch candidate documents from Firestore
    const candidates = await this.audioRepo.findNearbyCandidates(bounds);

    // 3. Compute exact Haversine distance and filter candidates
    const filteredCandidates: Array<{ audio: AudioRecording; distanceMeters: number }> = [];

    for (const cand of candidates) {
      const distance = this.geoService.calculateDistanceMeters(center, {
        latitude: cand.latitude,
        longitude: cand.longitude,
      });

      if (distance <= radiusMeters) {
        filteredCandidates.push({ audio: cand, distanceMeters: distance });
      }
    }

    // 4. Sort results by distance ascending, deterministic secondary sort by createdAt descending then id ascending
    filteredCandidates.sort((a, b) => {
      if (a.distanceMeters !== b.distanceMeters) {
        return a.distanceMeters - b.distanceMeters;
      }
      if (a.audio.createdAt !== b.audio.createdAt) {
        return b.audio.createdAt.localeCompare(a.audio.createdAt);
      }
      return a.audio.id.localeCompare(b.audio.id);
    });

    // 5. Decode cursor offset if provided
    let offset = 0;
    if (params.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(params.cursor, 'base64').toString('utf8'));
        if (typeof decoded.offset === 'number' && decoded.offset >= 0) {
          offset = decoded.offset;
        }
      } catch {
        logger.debug('Invalid pagination cursor supplied, defaulting to offset 0');
      }
    }

    const total = filteredCandidates.length;
    const pagedCandidates = filteredCandidates.slice(offset, offset + limit);
    const hasMore = offset + limit < total;
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ offset: offset + limit })).toString('base64')
      : null;

    // 6. Enrich with owner public information
    const userCache = new Map<string, string>();
    const results: NearbyAudioResult[] = await Promise.all(
      pagedCandidates.map(async ({ audio, distanceMeters }) => {
        let displayName = userCache.get(audio.ownerUid);
        if (!displayName) {
          const owner = await this.userRepo.findById(audio.ownerUid);
          displayName = owner?.displayName || `User_${audio.ownerUid.slice(0, 6)}`;
          userCache.set(audio.ownerUid, displayName);
        }

        return {
          id: audio.id,
          title: audio.title,
          description: audio.description,
          latitude: audio.latitude,
          longitude: audio.longitude,
          distanceMeters,
          durationSeconds: audio.durationSeconds,
          mimeType: audio.mimeType,
          createdAt: audio.createdAt,
          owner: {
            uid: audio.ownerUid,
            displayName,
          },
        };
      }),
    );

    return {
      results,
      pagination: {
        total,
        limit,
        nextCursor,
        hasMore,
      },
    };
  }
}

export const defaultAudioService = new AudioService();
