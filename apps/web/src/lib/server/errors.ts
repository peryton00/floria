// Floria — server-only error system
// Throw FloriaError everywhere in server code.
// toApiResponse() serializes it safely — no stack traces, no raw DB errors.

import "server-only";

export type ErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "RESOURCE_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "OUT_OF_STOCK"
  | "PRICE_CHANGED"
  | "ORDER_INVALID"
  | "INVALID_STATUS_TRANSITION"
  | "DATABASE_ERROR"
  | "PAYMENT_REQUIRED"
  | "INTERNAL_ERROR";

export class FloriaError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    /** HTTP status code to send */
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "FloriaError";
  }
}

// ── Named constructors ────────────────────────────────────────────────────────

export const Errors = {
  authRequired: () =>
    new FloriaError("AUTH_REQUIRED", "Authentication required.", 401),
  forbidden: (msg = "Access denied.") => new FloriaError("FORBIDDEN", msg, 403),
  notFound: (resource = "Resource") =>
    new FloriaError("RESOURCE_NOT_FOUND", `${resource} not found.`, 404),
  validation: (msg: string) => new FloriaError("VALIDATION_ERROR", msg, 422),
  rateLimited: () =>
    new FloriaError(
      "RATE_LIMITED",
      "Too many requests. Please slow down.",
      429,
    ),
  outOfStock: (name?: string) =>
    new FloriaError(
      "OUT_OF_STOCK",
      name
        ? `"${name}" is out of stock.`
        : "One or more items are out of stock.",
      409,
    ),
  priceChanged: () =>
    new FloriaError(
      "PRICE_CHANGED",
      "Prices have changed. Please review your cart.",
      409,
    ),
  orderInvalid: (msg = "Invalid order.") =>
    new FloriaError("ORDER_INVALID", msg, 400),
  invalidTransition: (from: string, to: string) =>
    new FloriaError(
      "INVALID_STATUS_TRANSITION",
      `Cannot transition from "${from}" to "${to}".`,
      409,
    ),
  database: () =>
    new FloriaError(
      "DATABASE_ERROR",
      "A database error occurred. Please try again.",
      500,
    ),
  internal: () =>
    new FloriaError("INTERNAL_ERROR", "An unexpected error occurred.", 500),
} as const;
