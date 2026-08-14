"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = void 0;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requireAdmin = requireAdmin;
exports.requireOperations = requireOperations;
exports.requireAnyRole = requireAnyRole;
exports.requirePermission = requirePermission;
exports.requireApprovedSeller = requireApprovedSeller;
const errors_js_1 = require("../utils/errors.js");
/**
 * Ensures request has an authenticated user context.
 */
function requireAuth(req, _res, next) {
    if (!req.user) {
        return next(errors_js_1.Errors.authRequired());
    }
    next();
}
exports.requireUser = requireAuth;
/**
 * Requires user to have one of the specified roles.
 */
function requireRole(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(errors_js_1.Errors.authRequired());
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(errors_js_1.Errors.forbidden(`Access restricted to roles: ${allowedRoles.join(", ")}.`));
        }
        next();
    };
}
function requireAdmin(req, res, next) {
    return requireRole("admin")(req, res, next);
}
function requireOperations(req, res, next) {
    return requireRole("operations", "admin")(req, res, next);
}
function requireAnyRole(roles) {
    return requireRole(...roles);
}
/**
 * Requires user to have a specific granular permission.
 */
function requirePermission(permission) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(errors_js_1.Errors.authRequired());
        }
        if (!req.user.permissions.includes(permission)) {
            return next(errors_js_1.Errors.forbidden(`Missing required permission: ${permission}`));
        }
        next();
    };
}
/**
 * Requires approved seller role for seller operational actions.
 * Throws 403 if role != seller or status != approved.
 */
function requireApprovedSeller(req, _res, next) {
    if (!req.user) {
        return next(errors_js_1.Errors.authRequired());
    }
    if (req.user.role === "admin" || req.user.role === "super_admin") {
        return next();
    }
    if (req.user.role !== "seller") {
        return next(errors_js_1.Errors.forbidden("Seller role required."));
    }
    if (!req.user.sellerId) {
        return next(errors_js_1.Errors.forbidden("No seller profile associated with account."));
    }
    if (req.user.sellerStatus === "suspended") {
        return next(errors_js_1.Errors.forbidden("Your seller account has been suspended."));
    }
    if (req.user.sellerStatus === "pending") {
        return next(errors_js_1.Errors.forbidden("Your seller account is pending approval."));
    }
    next();
}
