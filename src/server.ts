import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { initializeFirebase } from './config/firebase';
import { logger } from './common/utils/logger';

async function bootstrap() {
  try {
    // Initialize Firebase Admin SDK
    initializeFirebase();

    const server = http.createServer(app);

    server.listen(env.PORT, () => {
      logger.info(`====================================================`);
      logger.info(`  ProxiSpeak Backend Server is running!`);
      logger.info(`  Environment : ${env.NODE_ENV}`);
      logger.info(`  Port        : ${env.PORT}`);
      logger.info(`  Base URL    : ${env.API_BASE_URL}`);
      logger.info(`  Swagger UI  : ${env.API_BASE_URL}/api-docs`);
      logger.info(`  OpenAPI JSON: ${env.API_BASE_URL}/api-docs.json`);
      logger.info(`  Health Check: ${env.API_BASE_URL}/api/v1/health`);
      logger.info(`====================================================`);
    });

    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Gracefully terminating HTTP server...`);
      server.close(() => {
        logger.info('HTTP server closed. Exiting process.');
        process.exit(0);
      });

      // Force exit after 10 seconds if hanging
      setTimeout(() => {
        logger.error('Forced termination: HTTP server took too long to close.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Promise Rejection detected', reason);
    });

    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught Exception detected', err);
      process.exit(1);
    });
  } catch (err) {
    logger.error('Fatal error during application startup', err);
    process.exit(1);
  }
}

bootstrap();
