// Floria API — Centralized Configurable Rate Limiting
import rateLimit from "express-rate-limit";
import { Errors } from "../utils/errors.js";

// Configurable policies matching prompt specification:
// Auth: 10 requests / minute / IP
// Checkout: 10 requests / minute / user (or IP)
// Seller fulfillment: 30 requests / minute / user
// Public catalog: 120 requests / minute / IP

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      Errors.rateLimited(
        "Too many authentication requests. Please try again in a minute.",
      ),
    );
  },
});

export const checkoutRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id || req.ip || "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      Errors.rateLimited(
        "Too many checkout attempts. Please try again in a minute.",
      ),
    );
  },
});

export const sellerFulfillmentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) =>
    req.user?.sellerId || req.user?.id || req.ip || "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      Errors.rateLimited(
        "Fulfillment status update rate limit reached. Please slow down.",
      ),
    );
  },
});

export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.id || req.ip || "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(Errors.rateLimited("Admin API rate limit reached."));
  },
});

export const publicCatalogRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      Errors.rateLimited(
        "Public catalog rate limit reached. Please slow down.",
      ),
    );
  },
});

export const mediaUploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip || "unknown",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      Errors.rateLimited(
        "Media upload rate limit reached. Maximum 30 uploads per minute allowed.",
      ),
    );
  },
});
