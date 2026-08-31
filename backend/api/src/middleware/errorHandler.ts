// Floria API — Centralized Error Handling Middleware
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function errorHandler(
  err: Error | ApiError | any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode =
    typeof err?.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600
      ? err.statusCode
      : err instanceof ApiError
        ? err.statusCode
        : 500;

  const code =
    err?.code || (err instanceof ApiError ? err.code : "INTERNAL_ERROR");

  if (statusCode < 500 || err instanceof ApiError || (err?.code && err?.code !== "INTERNAL_ERROR")) {
    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message: err.message || "An error occurred processing your request.",
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
