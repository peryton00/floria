// Floria API — Centralized Role & Permission Authorization Middleware
import { Request, Response, NextFunction } from "express";
import { Errors } from "../utils/errors.js";
import { Permission } from "../config/constants.js";
import type { UserRole } from "@floria/types";

/**
 * Ensures request has an authenticated user context.
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    return next(Errors.authRequired());
  }
  next();
}

export const requireUser = requireAuth;

/**
 * Requires user to have one of the specified roles.
 */
export function requireRole(...allowedRoles: (UserRole | "super_admin")[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(Errors.authRequired());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        Errors.forbidden(
          `Access restricted to roles: ${allowedRoles.join(", ")}.`,
        ),
      );
    }

    next();
  };
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  return requireRole("admin")(req, res, next);
}

export function requireOperations(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  return requireRole("operations", "admin")(req, res, next);
}

export function requireAnyRole(roles: (UserRole | "super_admin")[]) {
  return requireRole(...roles);
}

/**
 * Requires user to have a specific granular permission.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(Errors.authRequired());
    }

    if (!req.user.permissions.includes(permission)) {
      return next(
        Errors.forbidden(`Missing required permission: ${permission}`),
      );
    }

    next();
  };
}

/**
 * Requires approved seller role for seller operational actions.
 * Throws 403 if role != seller or status != approved.
 */
export function requireApprovedSeller(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    return next(Errors.authRequired());
  }

  if (req.user.role === "admin" || req.user.role === "super_admin") {
    return next();
  }

  if (!req.user.sellerId) {
    return next(Errors.forbidden("No seller profile associated with account."));
  }

  if (
    req.user.role !== "seller" &&
    req.user.sellerStatus !== "approved" &&
    req.user.sellerStatus !== "active"
  ) {
    return next(Errors.forbidden("Seller role required."));
  }

  if (req.user.sellerStatus === "suspended" || req.user.sellerStatus === "deactivated") {
    return next(Errors.forbidden("Your seller account is currently unavailable."));
  }

  if (
    req.user.sellerStatus === "pending" ||
    req.user.sellerStatus === "under_review" ||
    req.user.sellerStatus === "application_submitted" ||
    req.user.sellerStatus === "application_incomplete"
  ) {
    return next(Errors.forbidden("Your seller account is pending approval."));
  }

  if (req.user.sellerStatus === "needs_correction") {
    return next(Errors.forbidden("Your seller application requires correction."));
  }

  if (req.user.sellerStatus === "rejected") {
    return next(Errors.forbidden("Your seller application was not approved."));
  }

  if (req.user.sellerStatus !== "approved" && req.user.sellerStatus !== "active") {
    return next(Errors.forbidden("Active seller approval required."));
  }

  next();
}
