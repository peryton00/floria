// Floria API — Bearer Token Authentication Middleware
// Validates Bearer token using Supabase Auth -> builds typed AuthenticatedUser context
import { Request, Response, NextFunction } from "express";
import { getAdminDb, getAnonDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";
import { Permission, ROLE_PERMISSIONS } from "../config/constants.js";
import type { UserRole } from "@floria/types";

export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
  role: UserRole | "super_admin";
  sellerId?: string;
  sellerStatus?: "pending" | "approved" | "suspended";
  permissions: Permission[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
    }
  }
}

/**
 * Extracts Bearer token, validates with Supabase Auth, resolves role & seller profile from DB.
 * Never trusts user_id, role, or seller_id from request body.
 */
export async function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      Errors.authRequired("Missing or invalid Authorization Bearer header."),
    );
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next(Errors.authRequired("Empty bearer token."));
  }

  try {
    const supabase = getAnonDb();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(Errors.authRequired("Invalid or expired session token."));
    }

    const adminDb = getAdminDb();
    const { data: profile } = await adminDb
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const roleStr = String(profile?.role || "customer");
    const role: UserRole | "super_admin" = roleStr as UserRole | "super_admin";

    let sellerId: string | undefined;
    let sellerStatus: "pending" | "approved" | "suspended" | undefined;

    if (
      roleStr === "seller" ||
      roleStr === "admin" ||
      roleStr === "super_admin"
    ) {
      const { data: sp } = await adminDb
        .from("seller_profiles")
        .select("id, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (sp) {
        sellerId = sp.id;
        sellerStatus = sp.status as "pending" | "approved" | "suspended";
      }
    }

    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["customer"];

    req.user = {
      id: user.id,
      email: user.email,
      role,
      sellerId,
      sellerStatus,
      permissions,
    };
    req.token = token;

    next();
  } catch (err) {
    next(Errors.authRequired("Authentication token verification failed."));
  }
}

/**
 * Optional authentication: attaches user if token is present, proceeds cleanly if missing.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  return authenticateToken(req, _res, next);
}
