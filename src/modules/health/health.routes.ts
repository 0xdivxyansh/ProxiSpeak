import { Router } from 'express';
import { defaultHealthController, HealthController } from './health.controller';

export function createHealthRoutes(controller: HealthController = defaultHealthController): Router {
  const router = Router();
  router.get('/', controller.getHealth);
  return router;
}

export const healthRoutes = createHealthRoutes();
