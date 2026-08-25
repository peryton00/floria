"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria Standalone Backend Server Entrypoint
const app_js_1 = require("./app.js");
const env_js_1 = require("./config/env.js");
const logger_js_1 = require("./utils/logger.js");
const media_worker_js_1 = require("./media/worker/media.worker.js");
async function bootstrap() {
    try {
        const env = (0, env_js_1.getEnv)();
        const app = (0, app_js_1.createApp)();
        // Start background media processing worker if Redis is reachable
        try {
            media_worker_js_1.mediaWorkerInstance.start();
            logger_js_1.logger.info("[MediaWorker] Background BullMQ queue worker started successfully.");
        }
        catch (err) {
            logger_js_1.logger.warn(`[MediaWorker] Background worker initialization notice: ${err.message}`);
        }
        const server = app.listen(env.API_PORT, () => {
            logger_js_1.logger.info(`Floria API Server running on port ${env.API_PORT} in [${env.NODE_ENV}] mode`);
            logger_js_1.logger.info(`Health check available at http://localhost:${env.API_PORT}/health`);
            logger_js_1.logger.info(`API v1 mounted at http://localhost:${env.API_PORT}/api/v1`);
        });
        const shutdown = async (signal) => {
            logger_js_1.logger.info(`Received ${signal}. Shutting down API server gracefully...`);
            try {
                await media_worker_js_1.mediaWorkerInstance.close();
            }
            catch (_) { }
            server.close(() => {
                logger_js_1.logger.info("API server closed.");
                process.exit(0);
            });
        };
        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    }
    catch (err) {
        logger_js_1.logger.error("Failed to start Floria API server", err);
        process.exit(1);
    }
}
bootstrap();
