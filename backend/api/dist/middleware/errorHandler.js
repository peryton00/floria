"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_js_1 = require("../utils/errors.js");
const logger_js_1 = require("../utils/logger.js");
function errorHandler(err, _req, res, _next) {
    if (err instanceof errors_js_1.ApiError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
        return;
    }
    // Unhandled error
    logger_js_1.logger.error("Unhandled API Error", err);
    const isProd = process.env.NODE_ENV === "production";
    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message: isProd ? "An unexpected internal server error occurred." : err.message,
        },
    });
}
