// Floria — server-only role-based authentication & authorization (RBAC)
// All authorization logic is enforced server-side using Supabase Auth + user_profiles.
// Client request payloads (user_id, role, seller_id, admin_id) are NEVER trusted.

import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Errors } from "./errors";
import type { UserRole } from "@floria/types";

export interface AuthUser {
  id: string;
  email: string | undefined;
  role: UserRole;
}

export interface AuthSeller extends AuthUser {
  sellerId: string;
  sellerStatus: "pending" | "approved" | "suspended";
  businessName: string;
}

/**
 * Returns the authenticated user and their authoritative role from `user_profiles`.
 * Throws AUTH_REQUIRED (401) if no active session.
 * Default role is 'customer' if profile does not specify one.
 */
export async function requireUser(): Promise<AuthUser> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw Errors.authRequired();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role: UserRole = (profile?.role as UserRole) || "customer";

  return {
    id: user.id,
    email: user.email ?? undefined,
    role,
  };
}

/**
 * Requires the authenticated user to have an exact role.
 * Throws FORBIDDEN (403) if role does not match.
 */
export async function requireRole(role: UserRole): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== role) {
    throw Errors.forbidden(`Access restricted to ${role} role.`);
  }
  return user;
}

/**
 * Requires the authenticated user to have one of the specified roles.
 * Throws FORBIDDEN (403) if user role is not in the allowed list.
 */
export async function requireAnyRole(roles: UserRole[]): Promise<AuthUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw Errors.forbidden(`Access requires one of the following roles: ${roles.join(", ")}.`);
  }
  return user;
}

/**
 * Requires an authenticated customer (or customer context).
 */
export async function requireCustomer(): Promise<AuthUser> {
  return requireUser();
}

/**
 * Returns seller profile information.
 * Supports checking status: for operational actions, requires role = seller AND status = approved.
 * If allowPendingOrSuspended is true, allows viewing onboarding/profile info.
 */
export async function requireSellerProfile(options?: { allowPendingOrSuspended?: boolean }): Promise<AuthSeller> {
  const user = await requireUser();

  if (user.role !== "seller" && user.role !== "admin") {
    throw Errors.forbidden("Seller role required.");
  }

  const supabase = await getSupabaseServerClient();
  const { data: sp, error } = await supabase
    .from("seller_profiles")
    .select("id, status, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !sp) throw Errors.forbidden("No seller profile found for this account.");

  const sellerStatus = sp.status as "pending" | "approved" | "suspended";

  if (!options?.allowPendingOrSuspended) {
    if (sellerStatus === "suspended") throw Errors.forbidden("Your seller account has been suspended.");
    if (sellerStatus === "pending") throw Errors.forbidden("Your seller account is pending approval.");
  }

  return {
    ...user,
    sellerId: sp.id as string,
    sellerStatus,
    businessName: sp.business_name as string,
  };
}

/**
 * Requires authenticated seller with approved status for operational seller actions.
 */
export async function requireSeller(): Promise<AuthSeller> {
  return requireSellerProfile({ allowPendingOrSuspended: false });
}

/**
 * Requires operations or admin role.
 */
export async function requireOperations(): Promise<AuthUser> {
  return requireAnyRole(["operations", "admin"]);
}

/**
 * Requires admin role.
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole("admin");
}

/**
 * Verifies that the authenticated seller owns the specified product.
 * Admin and operations roles bypass seller ownership check.
 */
export async function requireOwnedProduct(productId: string): Promise<{ user: AuthUser; sellerId?: string }> {
  const user = await requireUser();

  if (user.role === "admin" || user.role === "operations") {
    return { user };
  }

  const seller = await requireSeller();
  const supabase = await getSupabaseServerClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("seller_id")
    .eq("id", productId)
    .maybeSingle();

  if (error || !product) {
    throw Errors.notFound("Product");
  }

  if (product.seller_id !== seller.sellerId) {
    throw Errors.forbidden("You do not own this product.");
  }

  return { user: seller, sellerId: seller.sellerId };
}

/**
 * Verifies that the authenticated seller owns / is associated with the seller order fulfillment.
 * Admin and operations roles bypass seller ownership check.
 */
export async function requireOwnedSellerOrder(orderId: string): Promise<{ user: AuthUser; sellerId?: string }> {
  const user = await requireUser();

  if (user.role === "admin" || user.role === "operations") {
    return { user };
  }

  const seller = await requireSeller();
  const supabase = await getSupabaseServerClient();

  const { data: fulfillment, error } = await supabase
    .from("seller_order_fulfillments")
    .select("id, seller_id")
    .eq("order_id", orderId)
    .eq("seller_id", seller.sellerId)
    .maybeSingle();

  if (error || !fulfillment) {
    throw Errors.notFound("Seller order fulfillment");
  }

  return { user: seller, sellerId: seller.sellerId };
}
