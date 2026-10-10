import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../../config/env';
import { sendError } from '../utils/response';
import { ErrorCodes } from '../errors/error-codes';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    return sendError(
      res,
      ErrorCodes.TOO_MANY_REQUESTS,
      'Too many requests. Please slow down and try again later.',
      429,
      [],
      req.id,
    );
  },
  skip: () => env.NODE_ENV === 'test', // Skip in automated tests to prevent false failures
});

export const discoveryRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_DISCOVERY_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    return sendError(
      res,
      ErrorCodes.TOO_MANY_REQUESTS,
      'Geospatial discovery rate limit exceeded. Please try again in a minute.',
      429,
      [],
      req.id,
    );
  },
  skip: () => env.NODE_ENV === 'test',
});
