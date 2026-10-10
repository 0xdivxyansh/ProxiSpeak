export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export type UpdateUserProfileInput = {
  displayName?: string;
};
