// Floria API — Centralized Error Handling Middleware
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
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
  logger.error("Unhandled API Error", err);

  const isProd = process.env.NODE_ENV === "production";
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isProd
        ? "An unexpected internal server error occurred."
        : err.message,
    },
  });
}
