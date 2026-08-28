"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = exports.ApiError = void 0;
class ApiError extends Error {
    code;
    statusCode;
    constructor(code, message, statusCode = 400) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.ApiError = ApiError;
exports.Errors = {
    authRequired: (msg = "Authentication required.") => new ApiError("AUTH_REQUIRED", msg, 401),
    forbidden: (msg = "You do not have permission to perform this action.") => new ApiError("FORBIDDEN", msg, 403),
    notFound: (resource = "Resource") => new ApiError("RESOURCE_NOT_FOUND", `${resource} not found.`, 404),
    validation: (msg) => new ApiError("VALIDATION_ERROR", msg, 422),
    rateLimited: (msg = "Too many requests. Please slow down.") => new ApiError("RATE_LIMITED", msg, 429),
    outOfStock: (name) => new ApiError("OUT_OF_STOCK", name
        ? `"${name}" is out of stock.`
        : "One or more items are out of stock.", 409),
    invalidTransition: (from, to) => new ApiError("INVALID_STATUS_TRANSITION", `Cannot transition from "${from}" to "${to}".`, 409),
    database: (msg = "A database error occurred. Please try again.") => new ApiError("DATABASE_ERROR", msg, 500),
    internal: (msg = "An unexpected error occurred.") => new ApiError("INTERNAL_ERROR", msg, 500),
};
