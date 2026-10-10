import { Request, Response, NextFunction } from 'express';
import { AudioService, defaultAudioService } from './audio.service';
import { sendSuccess } from '../../common/utils/response';
import { UnauthorizedError } from '../../common/errors/app-error';
import { NearbyAudioQueryParams } from '../geospatial/geospatial.validator';

function getParamId(req: Request): string {
  const rawId = req.params.id;
  return Array.isArray(rawId) ? rawId[0] : (rawId as string);
}

export class AudioController {
  constructor(private audioService: AudioService = defaultAudioService) {}

  /**
   * POST /api/v1/audio
   * Initiates an upload session and returns signed upload URL.
   */
  createAudio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context is missing');
      }

      const session = await this.audioService.createUploadSession(req.user.uid, req.body);
      sendSuccess(res, session, 201, req.id);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/audio/:id/complete
   * Verifies file existence in storage and marks audio as published.
   */
  completeUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context is missing');
      }

      const audioId = getParamId(req);
      const published = await this.audioService.completeUpload(audioId, req.user.uid);
      sendSuccess(res, published, 200, req.id);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/audio/:id
   * Retrieves audio recording metadata.
   */
  getAudioById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audioId = getParamId(req);
      const audio = await this.audioService.getAudioById(audioId, req.user?.uid);
      sendSuccess(res, audio, 200, req.id);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/audio/:id/playback
   * Generates a time-limited signed URL for audio streaming/playback.
   */
  getPlayback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audioId = getParamId(req);
      const playbackData = await this.audioService.getPlaybackUrl(audioId, req.user?.uid);
      sendSuccess(res, playbackData, 200, req.id);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /api/v1/audio/:id
   * Updates mutable audio metadata (title, description, coordinates, visibility).
   */
  updateAudio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context is missing');
      }

      const audioId = getParamId(req);
      const updated = await this.audioService.updateAudio(audioId, req.user.uid, req.body);
      sendSuccess(res, updated, 200, req.id);
    } catch (err) {
      next(err);
    }
  };

  /**
   * DELETE /api/v1/audio/:id
   * Deletes audio recording metadata and removes file from cloud storage.
   */
  deleteAudio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context is missing');
      }

      const audioId = getParamId(req);
      await this.audioService.deleteAudio(audioId, req.user.uid);
      sendSuccess(res, { message: 'Audio recording deleted successfully' }, 200, req.id);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/audio/nearby
   * Discovers published audio recordings within geographic radius sorted by distance.
   */
  getNearby = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryParams = req.query as unknown as NearbyAudioQueryParams;
      const results = await this.audioService.discoverNearby(queryParams);
      sendSuccess(res, results, 200, req.id);
    } catch (err) {
      next(err);
    }
  };
}

export const defaultAudioController = new AudioController();
