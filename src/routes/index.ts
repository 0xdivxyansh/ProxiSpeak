import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes';
import { userRoutes } from '../modules/users/user.routes';
import { audioRoutes } from '../modules/audio/audio.routes';

export function createApiV1Router(): Router {
  const router = Router();

  router.use('/health', healthRoutes);
  router.use('/users', userRoutes);
  router.use('/audio', audioRoutes);

  return router;
}

export const apiV1Router = createApiV1Router();
