import { Request, Response } from 'express';
import { sendSuccess } from '../../common/utils/response';
import { env } from '../../config/env';
import { isFirebaseConfigured } from '../../config/firebase';

export class HealthController {
  getHealth = async (req: Request, res: Response): Promise<void> => {
    const isFirebaseInitialized = isFirebaseConfigured();

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      version: '1.0.0',
      dependencies: {
        firebase: {
          initialized: isFirebaseInitialized,
          projectId: env.FIREBASE_PROJECT_ID,
          storageBucket: env.FIREBASE_STORAGE_BUCKET,
          emulator: !!env.USE_EMULATOR,
        },
      },
    };

    sendSuccess(res, healthData, 200, req.id);
  };
}

export const defaultHealthController = new HealthController();
