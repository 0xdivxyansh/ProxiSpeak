import { IUserRepository, defaultUserRepository } from './user.repository';
import { UserProfile, UpdateUserProfileInput } from './user.model';
import { logger } from '../../common/utils/logger';

export class UserService {
  constructor(private userRepo: IUserRepository = defaultUserRepository) {}

  async getOrCreateProfile(
    uid: string,
    fallbackAuthData?: { email?: string; displayName?: string },
  ): Promise<UserProfile> {
    const existing = await this.userRepo.findById(uid);
    if (existing) {
      return existing;
    }

    // Auto-provision profile from Firebase Auth identity on first authenticated access
    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      uid,
      displayName:
        fallbackAuthData?.displayName ||
        fallbackAuthData?.email?.split('@')[0] ||
        `User_${uid.slice(0, 6)}`,
      email: fallbackAuthData?.email ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    logger.info(`Auto-provisioning user profile for UID: ${uid}`);
    return this.userRepo.create(newProfile);
  }

  async updateProfile(uid: string, input: UpdateUserProfileInput): Promise<UserProfile> {
    // Ensure profile exists first
    await this.getOrCreateProfile(uid);

    const updatePayload: Partial<UserProfile> = {};
    if (input.displayName !== undefined) {
      updatePayload.displayName = input.displayName.trim();
    }

    return this.userRepo.update(uid, updatePayload);
  }
}

export const defaultUserService = new UserService();
