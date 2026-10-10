import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getAuth as adminGetAuth, Auth } from 'firebase-admin/auth';
import { getFirestore as adminGetFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as adminGetStorage, Storage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';
import { env } from './env';
import { logger } from '../common/utils/logger';

let appInstance: App;

export function initializeFirebase(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    appInstance = existingApps[0];
    return appInstance;
  }

  // Configure Emulators if enabled
  if (env.USE_EMULATOR) {
    if (env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = env.FIRESTORE_EMULATOR_HOST;
    }
    if (env.FIREBASE_AUTH_EMULATOR_HOST) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = env.FIREBASE_AUTH_EMULATOR_HOST;
    }
    if (env.FIREBASE_STORAGE_EMULATOR_HOST) {
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = env.FIREBASE_STORAGE_EMULATOR_HOST;
    }
    logger.info('Firebase configured to use local Emulator Suite', {
      firestore: env.FIRESTORE_EMULATOR_HOST,
      auth: env.FIREBASE_AUTH_EMULATOR_HOST,
      storage: env.FIREBASE_STORAGE_EMULATOR_HOST,
    });
  } else {
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
    delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  }

  let credential;

  // 1. Try service account key string (raw JSON or base64)
  if (env.FIREBASE_SERVICE_ACCOUNT_KEY && env.FIREBASE_SERVICE_ACCOUNT_KEY.trim().length > 0) {
    try {
      let rawJson = env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      if (!rawJson.startsWith('{')) {
        rawJson = Buffer.from(rawJson, 'base64').toString('utf8');
      }
      const parsed = JSON.parse(rawJson);
      credential = cert(parsed);
      logger.info('Firebase Admin initialized with inline service account key');
    } catch (err) {
      logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY', err);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON format');
    }
  }
  // 2. Try service account JSON file path
  else if (
    env.FIREBASE_SERVICE_ACCOUNT_PATH &&
    env.FIREBASE_SERVICE_ACCOUNT_PATH.trim().length > 0
  ) {
    const resolvedPath = path.resolve(process.cwd(), env.FIREBASE_SERVICE_ACCOUNT_PATH.trim());
    if (fs.existsSync(resolvedPath)) {
      credential = cert(resolvedPath);
      logger.info('Firebase Admin initialized with service account file', { path: resolvedPath });
    } else {
      logger.warn(`Firebase service account file not found at: ${resolvedPath}`);
    }
  }

  // 3. Fallback to Application Default Credentials or Emulator/Test
  if (!credential) {
    if (env.USE_EMULATOR || env.NODE_ENV === 'test') {
      logger.info('Using emulator / default test credentials for Firebase Admin');
      credential = applicationDefault();
    } else {
      try {
        credential = applicationDefault();
        logger.info('Firebase Admin initialized with Application Default Credentials (ADC)');
      } catch (err) {
        logger.warn(
          'No Firebase service account credentials found. Operations requiring elevated cloud permissions may fail.',
          { error: err instanceof Error ? err.message : String(err) },
        );
      }
    }
  }

  try {
    appInstance = initializeApp({
      credential,
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });
    logger.info('Firebase Admin SDK initialized successfully', {
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (err) {
    const apps = getApps();
    if (apps.length > 0) {
      appInstance = apps[0];
    } else {
      logger.error('Critical failure initializing Firebase Admin SDK', err);
      throw err;
    }
  }

  return appInstance;
}

export function isFirebaseConfigured(): boolean {
  return getApps().length > 0;
}

// Lazy getters for Firebase services
export const getFirebaseAuth = (): Auth => {
  if (getApps().length === 0) initializeFirebase();
  return adminGetAuth();
};

export const getFirestore = (): Firestore => {
  if (getApps().length === 0) initializeFirebase();
  const db = adminGetFirestore();
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings might already be frozen
  }
  return db;
};

export const getFirebaseStorage = (): Storage => {
  if (getApps().length === 0) initializeFirebase();
  return adminGetStorage();
};

export const getStorageBucket = () => {
  const storage = getFirebaseStorage();
  return storage.bucket(env.FIREBASE_STORAGE_BUCKET);
};
