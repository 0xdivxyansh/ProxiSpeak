import express, { Application } from 'express';
import cors from 'cors';
import { openApiSpec } from '../../config/swagger';
import { requestIdMiddleware } from '../../common/middleware/request-id.middleware';
import { errorHandler, notFoundHandler } from '../../common/middleware/error.middleware';
import { InMemoryUserRepository } from '../../modules/users/user.repository';
import { InMemoryAudioRepository } from '../../modules/audio/audio.repository';
import { InMemoryStorageService } from '../../infrastructure/storage/storage.service';
import { GeospatialService } from '../../modules/geospatial/geospatial.service';
import { UserService } from '../../modules/users/user.service';
import { AudioService } from '../../modules/audio/audio.service';
import { UserController } from '../../modules/users/user.controller';
import { AudioController } from '../../modules/audio/audio.controller';
import { createUserRoutes } from '../../modules/users/user.routes';
import { createAudioRoutes } from '../../modules/audio/audio.routes';
import { createHealthRoutes } from '../../modules/health/health.routes';

export interface TestContext {
  app: Application;
  userRepo: InMemoryUserRepository;
  audioRepo: InMemoryAudioRepository;
  storageService: InMemoryStorageService;
  geoService: GeospatialService;
  userService: UserService;
  audioService: AudioService;
}

export function createTestApp(): TestContext {
  const userRepo = new InMemoryUserRepository();
  const audioRepo = new InMemoryAudioRepository();
  const storageService = new InMemoryStorageService();
  const geoService = new GeospatialService();

  const userService = new UserService(userRepo);
  const audioService = new AudioService(audioRepo, storageService, userRepo, geoService);

  const userController = new UserController(userService);
  const audioController = new AudioController(audioService);

  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestIdMiddleware);

  // OpenAPI JSON for testing
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiSpec);
  });

  const apiRouter = express.Router();
  apiRouter.use('/health', createHealthRoutes());
  apiRouter.use('/users', createUserRoutes(userController));
  apiRouter.use('/audio', createAudioRoutes(audioController));

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return {
    app,
    userRepo,
    audioRepo,
    storageService,
    geoService,
    userService,
    audioService,
  };
}
