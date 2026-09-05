// Floria Standalone Backend Server Entrypoint
import { initSentry } from "./config/sentry.js";
import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { mediaWorkerInstance } from "./media/worker/media.worker.js";

async function bootstrap() {
  try {
    initSentry();
    const env = getEnv();
    const app = createApp();

    // Start background media processing worker if Redis is reachable
    try {
      mediaWorkerInstance.start();
      logger.info(
        "[MediaWorker] Background BullMQ queue worker started successfully.",
      );
    } catch (err: any) {
      logger.warn(
        `[MediaWorker] Background worker initialization notice: ${err.message}`,
      );
    }

    const server = app.listen(env.API_PORT, () => {
      logger.info(
        `Floria API Server running on port ${env.API_PORT} in [${env.NODE_ENV}] mode`,
      );
      logger.info(
        `Health check available at http://localhost:${env.API_PORT}/health`,
      );
      logger.info(`API v1 mounted at http://localhost:${env.API_PORT}/api/v1`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down API server gracefully...`);
      try {
        await mediaWorkerInstance.close();
      } catch (_) {}
      server.close(() => {
        logger.info("API server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Failed to start Floria API server", err);
    process.exit(1);
  }
}

bootstrap();
