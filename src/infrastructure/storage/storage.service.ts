import { getStorageBucket, hasFirebaseCredentials } from '../../config/firebase';
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

import fs from 'fs';
import path from 'path';
import { inMemoryFiles } from './storage.routes';

export class FirebaseStorageService implements IStorageService {
  private get bucket() {
    return getStorageBucket();
  }

  async generateSignedUploadUrl(
    storagePath: string,
    contentType: string,
    expirySeconds = env.UPLOAD_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    if (!hasFirebaseCredentials() && !env.USE_EMULATOR) {
      return `${env.API_BASE_URL}/api/v1/storage/upload?path=${encodeURIComponent(storagePath)}`;
    }

    try {
      const file = this.bucket.file(storagePath);
      const expires = Date.now() + expirySeconds * 1000;
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires,
        contentType,
      });
      return url;
    } catch (err: unknown) {
      logger.warn(
        'Could not generate cloud signed upload URL (no Firebase service account private key). Using local backend storage fallback.',
        { storagePath, error: err instanceof Error ? err.message : String(err) },
      );

      if (env.USE_EMULATOR) {
        const emulatorHost = env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
        return `http://${emulatorHost}/v0/b/${env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(
          storagePath,
        )}?uploadType=media`;
      }

      return `${env.API_BASE_URL}/api/v1/storage/upload?path=${encodeURIComponent(storagePath)}`;
    }
  }

  async generateSignedPlaybackUrl(
    storagePath: string,
    expirySeconds = env.PLAYBACK_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    if (!hasFirebaseCredentials() && !env.USE_EMULATOR) {
      return `${env.API_BASE_URL}/api/v1/storage/media?path=${encodeURIComponent(storagePath)}`;
    }

    try {
      const file = this.bucket.file(storagePath);
      const expires = Date.now() + expirySeconds * 1000;
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires,
      });
      return url;
    } catch (err: unknown) {
      logger.warn(
        'Could not generate cloud signed playback URL (no Firebase service account private key). Using local backend media fallback.',
        { storagePath, error: err instanceof Error ? err.message : String(err) },
      );

      if (env.USE_EMULATOR) {
        const emulatorHost = env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
        return `http://${emulatorHost}/v0/b/${env.FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(
          storagePath,
        )}?alt=media`;
      }

      return `${env.API_BASE_URL}/api/v1/storage/media?path=${encodeURIComponent(storagePath)}`;
    }
  }

  async getFileMetadata(storagePath: string): Promise<StorageFileMetadata | null> {
    // 1. Check disk storage
    const localDiskPath = path.resolve(process.cwd(), 'uploads', storagePath);
    if (fs.existsSync(localDiskPath)) {
      const stat = fs.statSync(localDiskPath);
      return {
        exists: true,
        sizeBytes: stat.size,
        contentType: 'audio/mpeg',
        updatedAt: stat.mtime.toISOString(),
      };
    }

    // 2. Check inMemoryFiles
    const mem = inMemoryFiles.get(storagePath);
    if (mem) {
      return {
        exists: true,
        sizeBytes: mem.data.length,
        contentType: mem.contentType,
        updatedAt: mem.updatedAt,
      };
    }

    // 3. Fallback to Cloud Storage bucket
    try {
      const file = this.bucket.file(storagePath);
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
      logger.warn(`Could not query Cloud Storage object metadata: ${storagePath}`);
      return null;
    }
  }

  async deleteFile(storagePath: string): Promise<void> {
    inMemoryFiles.delete(storagePath);
    const localDiskPath = path.resolve(process.cwd(), 'uploads', storagePath);
    if (fs.existsSync(localDiskPath)) {
      try {
        fs.unlinkSync(localDiskPath);
      } catch {
        // ignore
      }
    }

    try {
      const file = this.bucket.file(storagePath);
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
