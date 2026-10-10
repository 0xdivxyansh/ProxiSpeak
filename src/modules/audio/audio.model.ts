export type AudioStatus =
  'pending_upload' | 'uploaded' | 'published' | 'failed' | 'deleting' | 'deleted';

export type AudioVisibility = 'public' | 'private' | 'unlisted';

export interface AudioRecording {
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
  status: AudioStatus;
  visibility: AudioVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface AudioOwnerPublicInfo {
  uid: string;
  displayName: string;
}

export interface NearbyAudioResult {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  durationSeconds: number | null;
  mimeType: string;
  createdAt: string;
  owner: AudioOwnerPublicInfo;
}

export interface CreateAudioInput {
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  visibility?: AudioVisibility;
  declaredMimeType: string;
  declaredSizeBytes: number;
}

export interface UpdateAudioInput {
  title?: string;
  description?: string;
  visibility?: AudioVisibility;
  latitude?: number;
  longitude?: number;
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
