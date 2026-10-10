import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.id || (res.locals?.requestId as string | undefined);

  // 1. Known AppError instances
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[${req.method} ${req.originalUrl}] Operational error: ${err.message}`, err, {
        requestId,
        code: err.code,
      });
    } else {
      logger.warn(`[${req.method} ${req.originalUrl}] Client error: ${err.message}`, {
        requestId,
        code: err.code,
        statusCode: err.statusCode,
        details: err.details,
      });
    }

    sendError(res, err.code, err.message, err.statusCode, err.details, requestId);
    return;
  }

  // 2. Firebase Auth errors
  if (err && typeof err === 'object' && 'code' in err) {
    const fbError = err as { code: string; message: string };

    if (
      fbError.code === 'auth/id-token-expired' ||
      fbError.code === 'auth/argument-error' ||
      fbError.code === 'auth/invalid-id-token' ||
      fbError.code === 'auth/id-token-revoked'
    ) {
      logger.warn(`Firebase Auth token error: ${fbError.message}`, {
        requestId,
        firebaseCode: fbError.code,
      });
      sendError(
        res,
        ErrorCodes.UNAUTHORIZED,
        'Authentication failed: Token is invalid, expired, or revoked.',
        401,
        [],
        requestId,
      );
      return;
    }
  }

  // 3. Fallback for unhandled / internal exceptions
  logger.error(
    `[${req.method} ${req.originalUrl}] Unhandled internal exception: ${
      err instanceof Error ? err.message : String(err)
    }`,
    err,
    { requestId },
  );

  sendError(
    res,
    ErrorCodes.INTERNAL_SERVER_ERROR,
    'An unexpected internal server error occurred.',
    500,
    [],
    requestId,
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  const requestId = req.id || (res.locals?.requestId as string | undefined);
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, { requestId });
  sendError(
    res,
    ErrorCodes.NOT_FOUND,
    `Cannot ${req.method} ${req.originalUrl}`,
    404,
    [],
    requestId,
  );
}
