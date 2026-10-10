import { getStorageBucket } from '../../config/firebase';
import { env } from '../../config/env';
import { logger } from '../../common/utils/logger';

export interface StorageFileMetadata {
  exists: boolean;
  sizeBytes: number;
  contentType: string;
  updatedAt?: string;
}

export interface IStorageService {
  generateSignedUploadUrl(
    storagePath: string,
    contentType: string,
    expirySeconds?: number,
  ): Promise<string>;

  generateSignedPlaybackUrl(storagePath: string, expirySeconds?: number): Promise<string>;

  getFileMetadata(storagePath: string): Promise<StorageFileMetadata | null>;

  deleteFile(storagePath: string): Promise<void>;
}

export class FirebaseStorageService implements IStorageService {
  private get bucket() {
    return getStorageBucket();
  }

  async generateSignedUploadUrl(
    storagePath: string,
    contentType: string,
    expirySeconds = env.UPLOAD_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    const file = this.bucket.file(storagePath);
    const expires = Date.now() + expirySeconds * 1000;

    try {
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires,
        contentType,
      });
      return url;
    } catch (err) {
      logger.error('Error generating signed upload URL via Firebase Admin', err, { storagePath });
      // When running in local development or emulator without cloud credentials, fallback to emulator URL
      if (env.USE_EMULATOR || env.NODE_ENV === 'test') {
        const emulatorHost = env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
        return `http://${emulatorHost}/v0/b/${env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(
          storagePath,
        )}?uploadType=media`;
      }
      throw err;
    }
  }

  async generateSignedPlaybackUrl(
    storagePath: string,
    expirySeconds = env.PLAYBACK_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    const file = this.bucket.file(storagePath);
    const expires = Date.now() + expirySeconds * 1000;

    try {
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires,
      });
      return url;
    } catch (err) {
      logger.error('Error generating signed playback URL via Firebase Admin', err, { storagePath });
      if (env.USE_EMULATOR || env.NODE_ENV === 'test') {
        const emulatorHost = env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
        return `http://${emulatorHost}/v0/b/${env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(
          storagePath,
        )}?alt=media`;
      }
      throw err;
    }
  }

  async getFileMetadata(storagePath: string): Promise<StorageFileMetadata | null> {
    const file = this.bucket.file(storagePath);

    try {
      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }

      const [metadata] = await file.getMetadata();
      return {
        exists: true,
        sizeBytes: Number(metadata.size || 0),
        contentType: metadata.contentType || 'application/octet-stream',
        updatedAt: metadata.updated,
      };
    } catch (err) {
      logger.error(`Failed to retrieve file metadata for: ${storagePath}`, err);
      throw err;
    }
  }

  async deleteFile(storagePath: string): Promise<void> {
    const file = this.bucket.file(storagePath);
    try {
      await file.delete({ ignoreNotFound: true });
      logger.debug(`File deleted from Storage: ${storagePath}`);
    } catch (err) {
      logger.warn(`Non-fatal warning deleting file ${storagePath}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

/**
 * In-memory storage mock for fast, self-contained unit and integration testing.
 */
export class InMemoryStorageService implements IStorageService {
  private files = new Map<string, { sizeBytes: number; contentType: string }>();

  async generateSignedUploadUrl(
    storagePath: string,
    contentType: string,
    _expirySeconds = 900,
  ): Promise<string> {
    return `https://storage.googleapis.com/${env.FIREBASE_STORAGE_BUCKET}/${storagePath}?mock-signed-upload=true&ct=${encodeURIComponent(
      contentType,
    )}`;
  }

  async generateSignedPlaybackUrl(storagePath: string, _expirySeconds = 900): Promise<string> {
    return `https://storage.googleapis.com/${env.FIREBASE_STORAGE_BUCKET}/${storagePath}?mock-signed-playback=true`;
  }

  async getFileMetadata(storagePath: string): Promise<StorageFileMetadata | null> {
    const file = this.files.get(storagePath);
    if (!file) return null;
    return {
      exists: true,
      sizeBytes: file.sizeBytes,
      contentType: file.contentType,
      updatedAt: new Date().toISOString(),
    };
  }

  async deleteFile(storagePath: string): Promise<void> {
    this.files.delete(storagePath);
  }

  // Test helper to simulate uploaded file in storage
  mockUpload(storagePath: string, sizeBytes: number, contentType: string): void {
    this.files.set(storagePath, { sizeBytes, contentType });
  }

  clear(): void {
    this.files.clear();
  }
}

export const defaultStorageService: IStorageService = new FirebaseStorageService();
