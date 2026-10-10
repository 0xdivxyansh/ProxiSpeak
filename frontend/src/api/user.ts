import { apiClient } from './client';

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string | null;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export const userApi = {
  getMe(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/users/me');
  },

  updateMe(data: { displayName: string }): Promise<UserProfile> {
    return apiClient.patch<UserProfile>('/users/me', data);
  },
};
