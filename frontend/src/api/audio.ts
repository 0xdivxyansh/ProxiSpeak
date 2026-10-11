import { apiClient } from './client';

export interface NearbyAudioItem {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  durationSeconds: number | null;
  mimeType: string;
  createdAt: string;
  owner: {
    uid: string;
    displayName: string;
  };
}

export interface NearbyAudioResponse {
  results: NearbyAudioItem[];
  pagination: {
    total: number;
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface CreateAudioRequest {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  visibility?: 'public' | 'private' | 'unlisted';
  declaredMimeType: string;
  declaredSizeBytes: number;
}

export interface UploadSessionResponse {
  audioId: string;
  storagePath: string;
  uploadUrl: string;
  uploadMethod: 'PUT';
  requiredHeaders: {
    'Content-Type': string;
  };
  expiresAt: string;
}

export interface PlaybackResponse {
  playbackUrl: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  expiresAt: string;
}

export interface AudioRecordingDetail {
  id: string;
  ownerUid: string;
  title: string;
  description: string;
  storagePath: string;
  latitude: number;
  longitude: number;
  geohash: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  status: 'pending_upload' | 'uploaded' | 'published' | 'failed' | 'deleting' | 'deleted';
  visibility: 'public' | 'private' | 'unlisted';
  createdAt: string;
  updatedAt: string;
}

export const audioApi = {
  getNearby(params: {
    lat: number;
    lng: number;
    radius?: number;
    limit?: number;
    cursor?: string;
  }): Promise<NearbyAudioResponse> {
    const query = new URLSearchParams();
    query.set('lat', params.lat.toString());
    query.set('lng', params.lng.toString());
    if (params.radius) query.set('radius', params.radius.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.cursor) query.set('cursor', params.cursor);

    return apiClient.get<NearbyAudioResponse>(`/audio/nearby?${query.toString()}`);
  },

  createUploadSession(data: CreateAudioRequest): Promise<UploadSessionResponse> {
    return apiClient.post<UploadSessionResponse>('/audio', data);
  },

  async uploadBinary(
    uploadUrl: string,
    file: Blob | File,
    mimeType: string,
    onProgress?: (progressPercent: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // In local development, route local backend URLs through the Vite proxy (/api)
      // to guarantee same-origin requests and avoid any cross-origin port issues
      let targetUrl = uploadUrl;
      const isRemoteClient =
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1';

      if (isRemoteClient) {
        if (targetUrl.includes('localhost:5000') || targetUrl.includes('127.0.0.1:5000')) {
          targetUrl = targetUrl
            .replace('http://localhost:5000', 'https://proxispeak.onrender.com')
            .replace('http://127.0.0.1:5000', 'https://proxispeak.onrender.com');
        }
      } else {
        if (targetUrl.startsWith('http://localhost:5000/api/')) {
          targetUrl = targetUrl.replace('http://localhost:5000/api/', '/api/');
        } else if (targetUrl.startsWith('http://127.0.0.1:5000/api/')) {
          targetUrl = targetUrl.replace('http://127.0.0.1:5000/api/', '/api/');
        }
      }

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', targetUrl);
      xhr.setRequestHeader('Content-Type', mimeType);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Binary upload failed with HTTP status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error occurred during Cloud Storage upload'));
      xhr.send(file);
    });
  },

  completeUpload(audioId: string): Promise<AudioRecordingDetail> {
    return apiClient.post<AudioRecordingDetail>(`/audio/${audioId}/complete`);
  },

  async getPlayback(audioId: string): Promise<PlaybackResponse> {
    const res = await apiClient.get<PlaybackResponse>(`/audio/${audioId}/playback`);
    const isRemoteClient =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';

    if (isRemoteClient) {
      if (res.playbackUrl.includes('localhost:5000') || res.playbackUrl.includes('127.0.0.1:5000')) {
        res.playbackUrl = res.playbackUrl
          .replace('http://localhost:5000', 'https://proxispeak.onrender.com')
          .replace('http://127.0.0.1:5000', 'https://proxispeak.onrender.com');
      }
    } else {
      if (res.playbackUrl.startsWith('http://localhost:5000/api/')) {
        res.playbackUrl = res.playbackUrl.replace('http://localhost:5000/api/', '/api/');
      } else if (res.playbackUrl.startsWith('http://127.0.0.1:5000/api/')) {
        res.playbackUrl = res.playbackUrl.replace('http://127.0.0.1:5000/api/', '/api/');
      }
    }
    return res;
  },

  getById(audioId: string): Promise<AudioRecordingDetail> {
    return apiClient.get<AudioRecordingDetail>(`/audio/${audioId}`);
  },

  update(
    audioId: string,
    data: {
      title?: string;
      description?: string;
      visibility?: 'public' | 'private' | 'unlisted';
      latitude?: number;
      longitude?: number;
    },
  ): Promise<AudioRecordingDetail> {
    return apiClient.patch<AudioRecordingDetail>(`/audio/${audioId}`, data);
  },

  delete(audioId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/audio/${audioId}`);
  },
};
