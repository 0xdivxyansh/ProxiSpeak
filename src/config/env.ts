import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { logger } from '../common/utils/logger';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const defaultApiBaseUrl =
  process.env.API_BASE_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  'http://localhost:5000';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_BASE_URL: z.string().url().default(defaultApiBaseUrl),
  CORS_ORIGIN: z.string().default('*'),

  FIREBASE_PROJECT_ID: z
    .string()
    .min(1, 'FIREBASE_PROJECT_ID is required')
    .default('proxispeak-f15c7'),
  FIREBASE_STORAGE_BUCKET: z
    .string()
    .min(1, 'FIREBASE_STORAGE_BUCKET is required')
    .default('proxispeak-f15c7.firebasestorage.app'),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),

  USE_EMULATOR: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1'),
  FIRESTORE_EMULATOR_HOST: z.string().optional(),
  FIREBASE_STORAGE_EMULATOR_HOST: z.string().optional(),
  FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),

  DEFAULT_DISCOVERY_RADIUS_METERS: z.coerce.number().positive().default(5000),
  MAX_DISCOVERY_RADIUS_METERS: z.coerce.number().positive().default(50000),
  DEFAULT_DISCOVERY_PAGE_LIMIT: z.coerce.number().int().positive().default(20),
  MAX_DISCOVERY_PAGE_LIMIT: z.coerce.number().int().positive().default(100),

  MAX_AUDIO_FILE_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 1024 * 1024), // 10MB
  PLAYBACK_URL_EXPIRY_SECONDS: z.coerce.number().int().positive().default(900), // 15 mins
  UPLOAD_URL_EXPIRY_SECONDS: z.coerce.number().int().positive().default(900), // 15 mins

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_DISCOVERY_MAX_REQUESTS: z.coerce.number().int().positive().default(30),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    logger.error('Invalid environment variables detected on startup:');
    for (const issue of result.error.issues) {
      logger.error(` - ${issue.path.join('.')}: ${issue.message}`);
    }
    throw new Error('Environment configuration validation failed. Check server logs.');
  }
  return result.data;
}

export const env = validateEnv();
