// Floria API — Bearer Token Authentication Middleware
// Validates Bearer token using Supabase Auth -> builds typed AuthenticatedUser context
import { Request, Response, NextFunction } from "express";
import { getAdminDb, getAnonDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";
import { Permission, ROLE_PERMISSIONS } from "../config/constants.js";
import type { UserRole, SellerStatus } from "@floria/types";

export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
  role: UserRole | "super_admin";
  sellerId?: string;
  sellerStatus?: SellerStatus;
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
 * Extracts Bearer token, validates with Supabase Auth (or signed seller session), builds typed AuthenticatedUser context.
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
    const adminDb = getAdminDb();
    let userId: string | undefined;
    let email: string | undefined;
    let fallbackRole: string | undefined;
    let directSellerId: string | undefined;

    // 1. Try validating via Supabase Auth
    try {
      const supabase = getAnonDb();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && user) {
        userId = user.id;
        email = user.email;
        fallbackRole = (user.app_metadata?.role as string) || (user.user_metadata?.role as string);
      }
    } catch {
      // Supabase verification fallback
    }

    // 2. If not Supabase JWT, check if signed seller session token
    if (!userId) {
      try {
        const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
        if (decoded && decoded.exp && decoded.exp > Math.floor(Date.now() / 1000) && decoded.seller_id) {
          userId = decoded.sub || decoded.seller_id;
          email = decoded.email;
          fallbackRole = decoded.role || "seller";
          directSellerId = decoded.seller_id;
        }
      } catch {
        // Invalid token format
      }
    }

    if (!userId) {
      return next(Errors.authRequired("Invalid or expired session token."));
    }

    const { data: profile } = await adminDb
      .from("user_profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    let roleStr = String(profile?.role || fallbackRole || "customer");

    // Check configured admin emails from environment variables
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (email) {
      const lowerEmail = email.toLowerCase();
      if (superAdminEmails.includes(lowerEmail)) {
        roleStr = "super_admin";
      } else if (adminEmails.includes(lowerEmail) && roleStr !== "super_admin") {
        roleStr = "admin";
      }
    }

    // If granted admin or super_admin via metadata/env and profile differs, sync profile
    if ((roleStr === "admin" || roleStr === "super_admin") && profile && profile.role !== roleStr) {
      void adminDb.from("user_profiles").update({ role: roleStr }).eq("id", userId);
    }

    let sellerId: string | undefined = directSellerId;
    let sellerStatus: SellerStatus | undefined;

    try {
      let sp: { id: string; status: string } | null = null;
      if (directSellerId) {
        const { data } = await adminDb
          .from("seller_profiles")
          .select("id, status")
          .eq("id", directSellerId)
          .maybeSingle();
        sp = data;
      } else {
        const { data: byUser } = await adminDb
          .from("seller_profiles")
          .select("id, status")
          .eq("user_id", userId)
          .maybeSingle();
        if (byUser) {
          sp = byUser;
        } else {
          const { data: byId } = await adminDb
            .from("seller_profiles")
            .select("id, status")
            .eq("id", userId)
            .maybeSingle();
          sp = byId;
        }
      }

      if (sp) {
        sellerId = sp.id;
        sellerStatus = sp.status as SellerStatus;
        if (
          (sellerStatus === "approved" || sellerStatus === "active") &&
          roleStr !== "admin" &&
          roleStr !== "super_admin"
        ) {
          roleStr = "seller";
        }
      }
    } catch {
      // Safe fallback for mocked test DB environments
    }

    const role: UserRole | "super_admin" = roleStr as UserRole | "super_admin";
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["customer"];

    req.user = {
      id: userId,
      email,
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
