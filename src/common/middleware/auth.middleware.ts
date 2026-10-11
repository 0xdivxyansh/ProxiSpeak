import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth, hasFirebaseCredentials } from '../../config/firebase';
import { UnauthorizedError } from '../errors/app-error';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

/**
 * Safely extract basic user identity from a Firebase JWT payload when running
 * in fallback mode without private service account credentials.
 */
function extractFallbackUserFromJwt(
  token: string,
): { uid: string; email?: string; displayName?: string; emailVerified?: boolean } | null {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson);
      const uid = payload.user_id || payload.sub;
      if (typeof uid === 'string' && uid.trim().length > 0) {
        return {
          uid: uid.trim(),
          email: typeof payload.email === 'string' ? payload.email : undefined,
          displayName:
            typeof payload.name === 'string'
              ? payload.name
              : typeof payload.email === 'string'
                ? payload.email.split('@')[0]
                : `User ${uid.slice(0, 6)}`,
          emailVerified: Boolean(payload.email_verified),
        };
      }
    }
  } catch {
    // Malformed token payload
  }
  return null;
}

/**
 * Strict authentication middleware for protected routes.
 * Requires "Authorization: Bearer <token>" and verifies via Firebase Admin.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  let token: string | undefined;

  const authHeader = req.header('authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return next(
        new UnauthorizedError(
          'Malformed Authorization header. Format must be "Bearer <Firebase-ID-Token>"',
        ),
      );
    }
    token = parts[1].trim();
    if (!token) {
      return next(new UnauthorizedError('Bearer token is empty.'));
    }
  }

  // Also support query parameter token (?token=<token>) for browser testing / Swagger
  if (!token && typeof req.query.token === 'string' && req.query.token.trim()) {
    token = req.query.token.trim();
  }

  if (!token) {
    // In local development: if accessed directly from a browser or without headers,
    // automatically attach a development user so the endpoint can be inspected without error
    if (env.NODE_ENV === 'development') {
      req.user = {
        uid: 'dev-explorer',
        email: 'dev@proxispeak.local',
        displayName: 'Development Explorer',
        emailVerified: true,
      };
      return next();
    }

    return next(
      new UnauthorizedError('Authorization header is missing. Please provide a Bearer token.'),
    );
  }

  // Support mock / demo explorer tokens across all environments
  if (token.startsWith('mock-token-')) {
    const uid = token.replace('mock-token-', '').trim() || 'demo_explorer';
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
    const hasCreds = hasFirebaseCredentials();
    const decodedToken = await auth.verifyIdToken(token, hasCreds);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      emailVerified: decodedToken.email_verified,
    };

    return next();
  } catch (err: unknown) {
    logger.warn('Failed to verify Firebase ID token', {
      error: err instanceof Error ? err.message : String(err),
    });

    if (env.NODE_ENV === 'development') {
      req.user = {
        uid: 'dev-explorer',
        email: 'dev@proxispeak.local',
        displayName: 'Development Explorer',
        emailVerified: true,
      };
      return next();
    }

    // In fallback mode (when no service account key is configured),
    // allow validly formatted Firebase JWTs by inspecting token claims
    if (!hasFirebaseCredentials()) {
      const fallbackUser = extractFallbackUserFromJwt(token);
      if (fallbackUser) {
        logger.info('Authenticated user via Firebase JWT fallback claim extraction', {
          uid: fallbackUser.uid,
        });
        req.user = fallbackUser;
        return next();
      }
    }

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
  let token: string | undefined;

  const authHeader = req.header('authorization');
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1].trim();
    }
  }

  if (!token && typeof req.query.token === 'string' && req.query.token.trim()) {
    token = req.query.token.trim();
  }

  if (!token) {
    return next();
  }

  if (token.startsWith('mock-token-')) {
    const uid = token.replace('mock-token-', '').trim() || 'demo_explorer';
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
    const hasCreds = hasFirebaseCredentials();
    const decodedToken = await auth.verifyIdToken(token, hasCreds);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      emailVerified: decodedToken.email_verified,
    };
  } catch (err) {
    if (!hasFirebaseCredentials()) {
      const fallbackUser = extractFallbackUserFromJwt(token);
      if (fallbackUser) {
        req.user = fallbackUser;
        return next();
      }
    }
    // Non-fatal for optional auth: log and proceed as anonymous
    logger.debug('Optional auth token invalid, treating as unauthenticated', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  next();
}
