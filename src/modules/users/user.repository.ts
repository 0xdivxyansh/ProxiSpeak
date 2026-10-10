import { getFirestore } from '../../config/firebase';
import { Collections } from '../../infrastructure/firestore/collections';
import { UserProfile } from './user.model';
import { logger } from '../../common/utils/logger';

export interface IUserRepository {
  findById(uid: string): Promise<UserProfile | null>;
  create(profile: UserProfile): Promise<UserProfile>;
  update(uid: string, data: Partial<UserProfile>): Promise<UserProfile>;
}

export class FirestoreUserRepository implements IUserRepository {
  private get collection() {
    return getFirestore().collection(Collections.USERS);
  }

  async findById(uid: string): Promise<UserProfile | null> {
    const doc = await this.collection.doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as UserProfile;
  }

  async create(profile: UserProfile): Promise<UserProfile> {
    await this.collection.doc(profile.uid).set(profile);
    logger.debug(`User profile created for UID: ${profile.uid}`);
    return profile;
  }

  async update(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const docRef = this.collection.doc(uid);
    const existing = await this.findById(uid);
    if (!existing) {
      throw new Error(`Cannot update non-existent user profile for UID: ${uid}`);
    }

    const updatedProfile: UserProfile = {
      ...existing,
      ...data,
      uid, // enforce UID immutability
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(updatedProfile, { merge: true });
    logger.debug(`User profile updated for UID: ${uid}`);
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
