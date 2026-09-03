// Floria API — Typed Application Errors
export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "RESOURCE_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "OUT_OF_STOCK"
  | "PRICE_CHANGED"
  | "ORDER_INVALID"
  | "INVALID_STATUS_TRANSITION"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;

  constructor(code: ApiErrorCode, message: string, statusCode = 400) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const Errors = {
  authRequired: (msg = "Authentication required.") =>
    new ApiError("AUTH_REQUIRED", msg, 401),
  forbidden: (msg = "You do not have permission to perform this action.") =>
    new ApiError("FORBIDDEN", msg, 403),
  notFound: (resource = "Resource") =>
    new ApiError("RESOURCE_NOT_FOUND", `${resource} not found.`, 404),
  validation: (msg: string) => new ApiError("VALIDATION_ERROR", msg, 422),
  conflict: (msg: string) => new ApiError("CONFLICT", msg, 409),
  rateLimited: (msg = "Too many requests. Please slow down.") =>
    new ApiError("RATE_LIMITED", msg, 429),
  outOfStock: (name?: string) =>
    new ApiError(
      "OUT_OF_STOCK",
      name
        ? `"${name}" is out of stock.`
        : "One or more items are out of stock.",
      409,
    ),
  invalidTransition: (from: string, to: string) =>
    new ApiError(
      "INVALID_STATUS_TRANSITION",
      `Cannot transition from "${from}" to "${to}".`,
      409,
    ),
  database: (msg = "A database error occurred. Please try again.") =>
    new ApiError("DATABASE_ERROR", msg, 500),
  internal: (msg = "An unexpected error occurred.") =>
    new ApiError("INTERNAL_ERROR", msg, 500),
};
