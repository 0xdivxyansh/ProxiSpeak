import { apiClient } from './client';

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  version: string;
  dependencies: {
    firebase: {
      initialized: boolean;
      projectId: string;
      storageBucket: string;
      emulator: boolean;
    };
  };
}

export const healthApi = {
  getHealth(): Promise<HealthResponse> {
    return apiClient.get<HealthResponse>('/health');
  },
};
