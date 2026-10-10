import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from '../../config/firebase';
import { UnauthorizedError } from '../errors/app-error';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

/**
 * Strict authentication middleware for protected routes.
 * Requires "Authorization: Bearer <token>" and verifies via Firebase Admin.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.header('authorization');

  if (!authHeader) {
    return next(
      new UnauthorizedError('Authorization header is missing. Please provide a Bearer token.'),
    );
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return next(
      new UnauthorizedError(
        'Malformed Authorization header. Format must be "Bearer <Firebase-ID-Token>"',
      ),
    );
  }

  const token = parts[1].trim();
  if (!token) {
    return next(new UnauthorizedError('Bearer token is empty.'));
  }

  // Support mock tokens during automated tests and local development testing
  if ((env.NODE_ENV === 'test' || env.NODE_ENV === 'development') && token.startsWith('mock-token-')) {
    const uid = token.replace('mock-token-', '');
    req.user = {
      uid,
      email: `${uid}@example.com`,
      displayName: `Explorer ${uid}`,
      emailVerified: true,
    };
    return next();
  }

  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token, true);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (err: unknown) {
    logger.warn('Failed to verify Firebase ID token', {
      error: err instanceof Error ? err.message : String(err),
    });

    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string }).code;
      if (code === 'auth/id-token-expired') {
        return next(
          new UnauthorizedError('Firebase ID token has expired. Please refresh your token.'),
        );
      }
      if (code === 'auth/id-token-revoked') {
        return next(new UnauthorizedError('Firebase ID token has been revoked.'));
      }
    }

    return next(new UnauthorizedError('Invalid or unverified Firebase ID token.'));
  }
}

/**
 * Optional authentication middleware for public endpoints with optional personalization.
 * If valid Bearer token is provided, attaches req.user; otherwise proceeds without failing.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.header('authorization');

  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return next();
  }

  const token = parts[1].trim();
  if (!token) {
    return next();
  }

  if ((env.NODE_ENV === 'test' || env.NODE_ENV === 'development') && token.startsWith('mock-token-')) {
    const uid = token.replace('mock-token-', '');
    req.user = {
      uid,
      email: `${uid}@example.com`,
      displayName: `Explorer ${uid}`,
      emailVerified: true,
    };
    return next();
  }

  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      emailVerified: decodedToken.email_verified,
    };
  } catch (err) {
    // Non-fatal for optional auth: log and proceed as anonymous
    logger.debug('Optional auth token invalid, treating as unauthenticated', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  next();
}
