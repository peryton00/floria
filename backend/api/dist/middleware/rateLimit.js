"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicCatalogRateLimiter = exports.adminRateLimiter = exports.sellerFulfillmentRateLimiter = exports.checkoutRateLimiter = exports.authRateLimiter = void 0;
// Floria API — Centralized Configurable Rate Limiting
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errors_js_1 = require("../utils/errors.js");
// Configurable policies matching prompt specification:
// Auth: 10 requests / minute / IP
// Checkout: 10 requests / minute / user (or IP)
// Seller fulfillment: 30 requests / minute / user
// Public catalog: 120 requests / minute / IP
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(errors_js_1.Errors.rateLimited("Too many authentication requests. Please try again in a minute."));
    },
});
exports.checkoutRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?.id || req.ip || "unknown",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(errors_js_1.Errors.rateLimited("Too many checkout attempts. Please try again in a minute."));
    },
});
exports.sellerFulfillmentRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 30,
    keyGenerator: (req) => req.user?.sellerId || req.user?.id || req.ip || "unknown",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(errors_js_1.Errors.rateLimited("Fulfillment status update rate limit reached. Please slow down."));
    },
});
exports.adminRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.user?.id || req.ip || "unknown",
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(errors_js_1.Errors.rateLimited("Admin API rate limit reached."));
    },
});
exports.publicCatalogRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(errors_js_1.Errors.rateLimited("Public catalog rate limit reached. Please slow down."));
    },
});
