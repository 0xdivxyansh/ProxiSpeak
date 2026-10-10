import { Router } from 'express';
import { AudioController, defaultAudioController } from './audio.controller';
import { requireAuth, optionalAuth } from '../../common/middleware/auth.middleware';
import { validateRequest } from '../../common/middleware/validate.middleware';
import { discoveryRateLimiter } from '../../common/middleware/rate-limiter.middleware';
import { createAudioSchema, updateAudioSchema, audioIdParamSchema } from './audio.validator';
import { nearbyAudioQuerySchema } from '../geospatial/geospatial.validator';

export function createAudioRoutes(controller: AudioController = defaultAudioController): Router {
  const router = Router();

  // 1. Geospatial Discovery (Public, Rate Limited)
  // Must be registered before /:id routes
  router.get(
    '/nearby',
    discoveryRateLimiter,
    validateRequest({ query: nearbyAudioQuerySchema }),
    controller.getNearby,
  );

  // 2. Audio Creation / Upload Session (Authenticated)
  router.post(
    '/',
    requireAuth,
    validateRequest({ body: createAudioSchema }),
    controller.createAudio,
  );

  // 3. Audio Upload Finalize / Publish (Authenticated)
  router.post(
    '/:id/complete',
    requireAuth,
    validateRequest({ params: audioIdParamSchema }),
    controller.completeUpload,
  );

  // 4. Audio Playback (Public or Authenticated Owner for private recordings)
  router.get(
    '/:id/playback',
    optionalAuth,
    validateRequest({ params: audioIdParamSchema }),
    controller.getPlayback,
  );

  // 5. Audio Metadata (Public or Authenticated Owner for private recordings)
  router.get(
    '/:id',
    optionalAuth,
    validateRequest({ params: audioIdParamSchema }),
    controller.getAudioById,
  );

  // 6. Update Audio Metadata (Authenticated Owner)
  router.patch(
    '/:id',
    requireAuth,
    validateRequest({ params: audioIdParamSchema, body: updateAudioSchema }),
    controller.updateAudio,
  );

  // 7. Delete Audio (Authenticated Owner)
  router.delete(
    '/:id',
    requireAuth,
    validateRequest({ params: audioIdParamSchema }),
    controller.deleteAudio,
  );

  return router;
}

export const audioRoutes = createAudioRoutes();
