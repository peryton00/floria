// Floria Standalone Backend Server Entrypoint
import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";

async function bootstrap() {
  try {
    const env = getEnv();
    const app = createApp();

    const server = app.listen(env.API_PORT, () => {
      logger.info(`Floria API Server running on port ${env.API_PORT} in [${env.NODE_ENV}] mode`);
      logger.info(`Health check available at http://localhost:${env.API_PORT}/health`);
      logger.info(`API v1 mounted at http://localhost:${env.API_PORT}/api/v1`);
    });

    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Shutting down API server gracefully...`);
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
