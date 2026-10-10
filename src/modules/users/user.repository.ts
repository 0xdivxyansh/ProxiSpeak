import { getFirestore, hasFirebaseCredentials } from '../../config/firebase';
import { Collections } from '../../infrastructure/firestore/collections';
import { UserProfile } from './user.model';
import { logger } from '../../common/utils/logger';
import { env } from '../../config/env';

export interface IUserRepository {
  findById(uid: string): Promise<UserProfile | null>;
  create(profile: UserProfile): Promise<UserProfile>;
  update(uid: string, data: Partial<UserProfile>): Promise<UserProfile>;
}

export class FirestoreUserRepository implements IUserRepository {
  private memoryUsers = new Map<string, UserProfile>();

  private get collection() {
    return getFirestore().collection(Collections.USERS);
  }

  async findById(uid: string): Promise<UserProfile | null> {
    if (!hasFirebaseCredentials() && !env.USE_EMULATOR) {
      return this.memoryUsers.get(uid) || null;
    }

    try {
      const doc = await this.collection.doc(uid).get();
      if (!doc.exists) {
        return this.memoryUsers.get(uid) || null;
      }
      const data = doc.data() as UserProfile;
      this.memoryUsers.set(uid, data);
      return data;
    } catch (err: unknown) {
      logger.error(`Error querying user profile for UID: ${uid}`, err);
      const e = err as { code?: number | string; message?: string };
      if (
        e?.code === 14 ||
        e?.code === 7 ||
        e?.code === 16 ||
        e?.message?.includes('ECONNREFUSED') ||
        e?.message?.includes('UNAVAILABLE') ||
        e?.message?.includes('credentials')
      ) {
        return this.memoryUsers.get(uid) || null;
      }
      throw err;
    }
  }

  async create(profile: UserProfile): Promise<UserProfile> {
    this.memoryUsers.set(profile.uid, { ...profile });

    if (hasFirebaseCredentials() || env.USE_EMULATOR) {
      try {
        await this.collection.doc(profile.uid).set(profile);
        logger.debug(`User profile created for UID: ${profile.uid}`);
      } catch (err: unknown) {
        logger.warn(`Could not persist user profile to Firestore (using fallback): ${profile.uid}`);
      }
    }

    return profile;
  }

  async update(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const existing = await this.findById(uid);
    const updatedProfile: UserProfile = {
      ...(existing || {
        uid,
        displayName: 'User',
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      ...data,
      uid, // enforce UID immutability
      updatedAt: new Date().toISOString(),
    };

    this.memoryUsers.set(uid, updatedProfile);

    try {
      await this.collection.doc(uid).set(updatedProfile, { merge: true });
      logger.debug(`User profile updated for UID: ${uid}`);
    } catch (err: unknown) {
      logger.warn(`Could not persist user profile update to Firestore (using fallback): ${uid}`);
    }

    return updatedProfile;
  }
}

/**
 * In-memory repository for deterministic testing without external Firestore dependency.
 */
export class InMemoryUserRepository implements IUserRepository {
  private users = new Map<string, UserProfile>();

  async findById(uid: string): Promise<UserProfile | null> {
    const user = this.users.get(uid);
    return user ? { ...user } : null;
  }

  async create(profile: UserProfile): Promise<UserProfile> {
    this.users.set(profile.uid, { ...profile });
    return { ...profile };
  }

  async update(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const existing = this.users.get(uid);
    if (!existing) {
      throw new Error(`User not found: ${uid}`);
    }
    const updated: UserProfile = {
      ...existing,
      ...data,
      uid,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(uid, updated);
    return { ...updated };
  }

  clear(): void {
    this.users.clear();
  }
}

export const defaultUserRepository: IUserRepository = new FirestoreUserRepository();
