"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FALLBACK_COMMISSION_RATE = exports.ROLE_PERMISSIONS = void 0;
exports.ROLE_PERMISSIONS = {
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
exports.DEFAULT_FALLBACK_COMMISSION_RATE = 12.0;
