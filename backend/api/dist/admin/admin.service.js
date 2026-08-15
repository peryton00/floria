"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = exports.AdminService = void 0;
// Floria API — Admin Service
const user_repository_js_1 = require("../database/repositories/user.repository.js");
const seller_repository_js_1 = require("../database/repositories/seller.repository.js");
const product_repository_js_1 = require("../database/repositories/product.repository.js");
const category_repository_js_1 = require("../database/repositories/category.repository.js");
const order_repository_js_1 = require("../database/repositories/order.repository.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const errors_js_1 = require("../utils/errors.js");
class AdminService {
    async getDashboard() {
        const [users, sellers, prods, orders] = await Promise.all([
            user_repository_js_1.userRepository.findAll(1000),
            seller_repository_js_1.sellerRepository.findAll(),
            product_repository_js_1.productRepository.findAll(),
            order_repository_js_1.orderRepository.findAllMasterOrders(),
        ]);
        const { settingsRepository } = await import("../database/repositories/settings.repository.js");
        const commissionRate = await settingsRepository.getCommissionRate();
        const totalCustomers = users.filter((u) => u.role === "customer").length;
        const totalSellers = sellers.length;
        const pendingSellerApplications = sellers.filter((s) => s.status === "pending").length;
        const approvedSellers = sellers.filter((s) => s.status === "approved").length;
        const suspendedSellers = sellers.filter((s) => s.status === "suspended").length;
        const totalProducts = prods.length;
        const activeProducts = prods.filter((p) => p.status === "active").length;
        const draftProducts = prods.filter((p) => p.status === "draft").length;
        const outOfStockProducts = prods.filter((p) => {
            const qty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
            return qty <= 0;
        }).length;
        let pendingOrders = 0;
        let preparingOrders = 0;
        let readyForPickupOrders = 0;
        let outForDeliveryOrders = 0;
        let deliveredOrders = 0;
        let cancelledOrders = 0;
        let totalOrderValue = 0;
        let totalItemsSold = 0;
        orders.forEach((o) => {
            const st = (o.status || "").toLowerCase();
            if (st === "order placed" || st === "nursery confirmed")
                pendingOrders++;
            else if (st === "preparing")
                preparingOrders++;
            else if (st === "ready for pickup" || st === "picked up")
                readyForPickupOrders++;
            else if (st === "packing" || st === "out for delivery")
                outForDeliveryOrders++;
            else if (st === "delivered")
                deliveredOrders++;
            else if (st === "cancelled")
                cancelledOrders++;
            totalOrderValue += o.subtotal_paise || 0;
            (o.order_items || []).forEach((item) => {
                totalItemsSold += item.quantity || 1;
            });
        });
        const platformRevenue = Math.round(totalOrderValue * (commissionRate / 100));
        return {
            users: {
                totalCustomers,
                totalSellers,
                pendingSellerApplications,
                approvedSellers,
                suspendedSellers,
            },
            products: {
                totalProducts,
                activeProducts,
                draftProducts,
                outOfStockProducts,
            },
            orders: {
                totalOrders: orders.length,
                pendingOrders,
                preparingOrders,
                readyForPickupOrders,
                outForDeliveryOrders,
                deliveredOrders,
                cancelledOrders,
            },
            platform: {
                totalOrderValue,
                platformRevenue,
                totalItemsSold,
            },
        };
    }
    // ── Users Management ─────────────────────────────────────────────────────
    async getUsers() {
        return user_repository_js_1.userRepository.findAll();
    }
    async getUserById(id) {
        const user = await user_repository_js_1.userRepository.findById(id);
        if (!user)
            throw errors_js_1.Errors.notFound("User");
        return user;
    }
    async updateUserStatus(adminUserId, userId, status, rationale) {
        const user = await user_repository_js_1.userRepository.findById(userId);
        if (!user)
            throw errors_js_1.Errors.notFound("User");
        const action = status === "suspended" ? "CUSTOMER_SUSPENDED" : "CUSTOMER_REACTIVATED";
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action,
            resource_type: "user_profile",
            resource_id: userId,
            metadata: { from: user.role, status, rationale: rationale || null },
        });
        return { id: userId, status };
    }
    // ── Seller Management ────────────────────────────────────────────────────
    async getSellers(status) {
        return seller_repository_js_1.sellerRepository.findAll(status);
    }
    async getSellerById(id) {
        const seller = await seller_repository_js_1.sellerRepository.findById(id);
        if (!seller)
            throw errors_js_1.Errors.notFound("Seller profile");
        return seller;
    }
    async updateSellerStatus(adminUserId, sellerId, status) {
        const seller = await seller_repository_js_1.sellerRepository.findById(sellerId);
        if (!seller)
            throw errors_js_1.Errors.notFound("Seller profile");
        const currentStatus = seller.status;
        if (currentStatus === status) {
            return { id: sellerId, status };
        }
        if (currentStatus === "rejected" && status === "approved") {
            throw errors_js_1.Errors.validation("Cannot directly approve a rejected seller application without resubmission");
        }
        let action = "SELLER_UPDATED";
        if (status === "approved")
            action = "SELLER_APPROVED";
        else if (status === "rejected")
            action = "SELLER_REJECTED";
        else if (status === "suspended")
            action = "SELLER_SUSPENDED";
        else if (status === "pending" || (currentStatus === "suspended" && status === "approved"))
            action = "SELLER_REACTIVATED";
        const success = await seller_repository_js_1.sellerRepository.updateStatus(sellerId, status);
        if (!success)
            throw errors_js_1.Errors.database("Failed to update seller status.");
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action,
            resource_type: "seller_profile",
            resource_id: sellerId,
            metadata: { from: currentStatus, to: status },
        });
        return { id: sellerId, status };
    }
    async getSellerDocuments(sellerId) {
        const seller = await seller_repository_js_1.sellerRepository.findById(sellerId);
        if (!seller)
            throw errors_js_1.Errors.notFound("Seller profile");
        return {
            sellerId,
            documents: [
                { type: "nursery_license", url: "/documents/sample_license.pdf", status: "verified" },
                { type: "gst_certificate", url: "/documents/sample_gst.pdf", status: "verified" },
            ],
        };
    }
    // ── Product Moderation ────────────────────────────────────────────────────
    async getProducts(filters) {
        return product_repository_js_1.productRepository.findAll(filters);
    }
    async getProductById(id) {
        const prod = await product_repository_js_1.productRepository.findById(id);
        if (!prod)
            throw errors_js_1.Errors.notFound("Product");
        return prod;
    }
    async updateProductStatus(adminUserId, productId, status) {
        const prod = await product_repository_js_1.productRepository.findById(productId);
        if (!prod)
            throw errors_js_1.Errors.notFound("Product");
        let action = "PRODUCT_MODERATED";
        if (status === "active")
            action = "PRODUCT_PUBLISHED";
        else if (status === "inactive" || status === "draft")
            action = "PRODUCT_UNPUBLISHED";
        else if (status === "deleted" || status === "archived")
            action = "PRODUCT_ARCHIVED";
        const success = await product_repository_js_1.productRepository.updateStatus(productId, status);
        if (!success)
            throw errors_js_1.Errors.database("Failed to update product status");
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action,
            resource_type: "product",
            resource_id: productId,
            metadata: { from: prod.status, to: status },
        });
        return { id: productId, status };
    }
    // ── Categories Management ─────────────────────────────────────────────────
    async getCategories() {
        return category_repository_js_1.categoryRepository.findAll();
    }
    async getCategoryProductsCount(categoryId) {
        const prods = await product_repository_js_1.productRepository.findAll({ categoryId });
        return { categoryId, activeProductsCount: prods.length };
    }
    async createCategory(adminUserId, payload) {
        const existing = await category_repository_js_1.categoryRepository.findBySlug(payload.slug);
        if (existing)
            throw errors_js_1.Errors.validation("A category with this slug already exists");
        const category = await category_repository_js_1.categoryRepository.createCategory(payload);
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "CATEGORY_CREATED",
            resource_type: "category",
            resource_id: category.id,
            metadata: { name: category.name, slug: category.slug },
        });
        return category;
    }
    async updateCategory(adminUserId, categoryId, updates) {
        const existing = await category_repository_js_1.categoryRepository.findById(categoryId);
        if (!existing)
            throw errors_js_1.Errors.notFound("Category");
        const category = await category_repository_js_1.categoryRepository.updateCategory(categoryId, updates);
        const action = updates.is_active === false ? "CATEGORY_DISABLED" : "CATEGORY_UPDATED";
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action,
            resource_type: "category",
            resource_id: categoryId,
            metadata: updates,
        });
        return category;
    }
    // ── Orders Oversight ──────────────────────────────────────────────────────
    async getOrders(adminUserId, filters) {
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "ORDER_VIEWED_BY_ADMIN",
            resource_type: "orders_list",
        });
        return order_repository_js_1.orderRepository.findAllMasterOrders(filters);
    }
    async getOrderById(adminUserId, id) {
        const order = await order_repository_js_1.orderRepository.findById(id);
        if (!order)
            throw errors_js_1.Errors.notFound("Master order");
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "ORDER_VIEWED_BY_ADMIN",
            resource_type: "order",
            resource_id: id,
        });
        return order;
    }
    // ── Audit Logs ────────────────────────────────────────────────────────────
    async getAuditLogs(filters) {
        const logs = await audit_repository_js_1.auditRepository.findAll();
        let results = logs;
        if (filters?.role) {
            results = results.filter((l) => l.actor_role === filters.role);
        }
        if (filters?.action) {
            results = results.filter((l) => l.action === filters.action);
        }
        if (filters?.actorId) {
            results = results.filter((l) => l.actor_user_id === filters.actorId);
        }
        return results;
    }
    async getAnalytics(filters) {
        const orders = await order_repository_js_1.orderRepository.findAllMasterOrders();
        const range = filters?.range || "30d";
        const now = new Date();
        const startDate = new Date();
        if (range === "7d")
            startDate.setDate(now.getDate() - 7);
        else if (range === "90d")
            startDate.setDate(now.getDate() - 90);
        else if (range === "12m")
            startDate.setFullYear(now.getFullYear() - 1);
        else
            startDate.setDate(now.getDate() - 30); // default 30d
        const filtered = orders.filter((o) => new Date(o.created_at) >= startDate);
        const groups = {};
        const { settingsRepository } = await import("../database/repositories/settings.repository.js");
        const commissionRate = await settingsRepository.getCommissionRate();
        if (range === "12m") {
            filtered.forEach((o) => {
                const d = new Date(o.created_at);
                const key = d.toLocaleString("default", { month: "short", year: "numeric" });
                if (!groups[key])
                    groups[key] = { gmv: 0, orders: 0, revenue: 0 };
                const gmv = o.total_paise || o.subtotal_paise || 0;
                groups[key].gmv += gmv;
                groups[key].orders += 1;
                groups[key].revenue += Math.round(gmv * (commissionRate / 100));
            });
        }
        else {
            filtered.forEach((o) => {
                const d = new Date(o.created_at);
                const key = d.toLocaleString("default", { day: "numeric", month: "short" });
                if (!groups[key])
                    groups[key] = { gmv: 0, orders: 0, revenue: 0 };
                const gmv = o.total_paise || o.subtotal_paise || 0;
                groups[key].gmv += gmv;
                groups[key].orders += 1;
                groups[key].revenue += Math.round(gmv * (commissionRate / 100));
            });
        }
        // Sort chronologically by ordering the array
        const timeSeries = Object.entries(groups)
            .map(([label, val]) => ({
            label,
            gmv: val.gmv,
            orders: val.orders,
            revenue: val.revenue,
        }))
            // Reverse or order to ensure chronological flow
            .reverse();
        return {
            timeSeries,
            commissionRate,
        };
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
