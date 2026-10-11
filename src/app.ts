import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { openApiSpec } from './config/swagger';
import { apiV1Router } from './routes';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';
import { globalRateLimiter } from './common/middleware/rate-limiter.middleware';
import { errorHandler, notFoundHandler } from './common/middleware/error.middleware';

export function createApp(): Application {
  const app = express();

  // 1. Security HTTP headers via Helmet
  // Allow inline scripts/styles for Swagger UI and cross-origin audio streaming
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // 2. CORS configuration
  const corsOriginHandler = (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Non-browser or server-to-server requests have no Origin header
    if (!origin) return callback(null, true);

    if (env.CORS_ORIGIN === '*') return callback(null, true);

    // In development/test mode, dynamically allow any localhost or 127.0.0.1 port
    if (env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    const configuredOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
    if (configuredOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  };

  app.use(
    cors({
      origin: corsOriginHandler,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );

  // 3. Body parsers with safe payload limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. Request ID tracking & correlation
  app.use(requestIdMiddleware);

  // 5. Global rate limiting
  app.use(globalRateLimiter);

  // 6. Swagger OpenAPI Documentation routes
  app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiSpec);
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      explorer: true,
      customSiteTitle: 'ProxiSpeak API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
      },
    }),
  );

  // Root endpoint redirect to API docs
  app.get('/', (_req: Request, res: Response) => {
    res.redirect('/api-docs');
  });

  // 7. Core REST API endpoints (/api/v1)
  app.use('/api/v1', apiV1Router);

  // 8. 404 Handler for undefined routes
  app.use(notFoundHandler);

  // 9. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
