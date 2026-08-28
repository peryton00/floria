"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestCorrelationMiddleware = requestCorrelationMiddleware;
const crypto_1 = require("crypto");
const logger_js_1 = require("../utils/logger.js");
function requestCorrelationMiddleware(req, res, next) {
    // Validate or generate X-Request-ID
    const incomingId = req.header("X-Request-ID");
    const requestId = incomingId && /^[a-zA-Z0-9_-]{8,64}$/.test(incomingId)
        ? incomingId
        : (0, crypto_1.randomUUID)();
    // Attach to request and response header
    req.headers["x-request-id"] = requestId;
    res.setHeader("X-Request-ID", requestId);
    const startTime = Date.now();
    res.on("finish", () => {
        const durationMs = Date.now() - startTime;
        const logData = {
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs,
            ip: req.ip,
            userId: req.user?.id,
            role: req.user?.role,
        };
        if (res.statusCode >= 500) {
            logger_js_1.logger.error(`API Server Error ${res.statusCode} ${req.method} ${req.originalUrl}`, logData);
        }
        else if (res.statusCode >= 400) {
            logger_js_1.logger.warn(`API Client Error ${res.statusCode} ${req.method} ${req.originalUrl}`, logData);
        }
        else {
            logger_js_1.logger.info(`API Request ${res.statusCode} ${req.method} ${req.originalUrl}`, logData);
        }
    });
    next();
}
