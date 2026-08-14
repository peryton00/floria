// Floria API — System Constants & Permissions
import type { UserRole } from "@floria/types";

export type Permission =
  | "profile.read.self"
  | "profile.update.self"
  | "addresses.read.self"
  | "addresses.manage.self"
  | "cart.read.self"
  | "cart.manage.self"
  | "wishlist.read.self"
  | "wishlist.manage.self"
  | "orders.read.self"
  | "checkout.create"
  | "profile.read.own"
  | "profile.update.own"
  | "products.read.own"
  | "products.create.own"
  | "products.update.own"
  | "inventory.read.own"
  | "inventory.update.own"
  | "orders.read.own"
  | "orders.fulfill.own"
  | "orders.read"
  | "fulfillment.read"
  | "fulfillment.update"
  | "pickup.manage"
  | "delivery.manage"
  | "users.read"
  | "sellers.read"
  | "sellers.approve"
  | "sellers.suspend"
  | "products.read"
  | "products.moderate"
  | "categories.manage"
  | "reports.read"
  | "audit_logs.read"
  | "platform.admin";

export const ROLE_PERMISSIONS: Record<UserRole | "super_admin", Permission[]> = {
  customer: [
    "profile.read.self",
    "profile.update.self",
    "addresses.read.self",
    "addresses.manage.self",
    "cart.read.self",
    "cart.manage.self",
    "wishlist.read.self",
    "wishlist.manage.self",
    "orders.read.self",
    "checkout.create",
  ],
  seller: [
    "profile.read.own",
    "profile.update.own",
    "products.read.own",
    "products.create.own",
    "products.update.own",
    "inventory.read.own",
    "inventory.update.own",
    "orders.read.own",
    "orders.fulfill.own",
  ],
  operations: [
    "orders.read",
    "fulfillment.read",
    "fulfillment.update",
    "pickup.manage",
    "delivery.manage",
  ],
  admin: [
    "users.read",
    "sellers.read",
    "sellers.approve",
    "sellers.suspend",
    "products.read",
    "products.moderate",
    "orders.read",
    "categories.manage",
    "reports.read",
    "audit_logs.read",
  ],
  super_admin: [
    "users.read",
    "sellers.read",
    "sellers.approve",
    "sellers.suspend",
    "products.read",
    "products.moderate",
    "orders.read",
    "categories.manage",
    "reports.read",
    "audit_logs.read",
    "platform.admin",
  ],
};

// Default fallback commission rate percentage (12.0%) used ONLY when platform_settings table is uninitialized
export const DEFAULT_FALLBACK_COMMISSION_RATE = 12.0;
