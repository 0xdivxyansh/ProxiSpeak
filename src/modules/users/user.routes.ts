import { Router } from 'express';
import { defaultUserController, UserController } from './user.controller';
import { requireAuth } from '../../common/middleware/auth.middleware';
import { validateRequest } from '../../common/middleware/validate.middleware';
import { updateUserProfileSchema } from './user.validator';

export function createUserRoutes(controller: UserController = defaultUserController): Router {
  const router = Router();

  router.use(requireAuth);

  router.get('/me', controller.getMe);
  router.patch('/me', validateRequest({ body: updateUserProfileSchema }), controller.updateMe);

  return router;
}

export const userRoutes = createUserRoutes();
