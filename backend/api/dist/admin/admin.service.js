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
const database_js_1 = require("../config/database.js");
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
    async getSellerApplications(status) {
        const { sellerAuthRepository } = await import("../database/repositories/seller-auth.repository.js");
        return sellerAuthRepository.findAllApplications(status);
    }
    async updateSellerStatus(adminUserId, sellerId, status, reason) {
        const seller = await seller_repository_js_1.sellerRepository.findById(sellerId);
        if (!seller)
            throw errors_js_1.Errors.notFound("Seller profile");
        const currentStatus = seller.status;
        if (currentStatus === "rejected" && status === "approved") {
            throw errors_js_1.Errors.validation("Cannot directly approve a rejected seller application without resubmission");
        }
        let action = "SELLER_UPDATED";
        if (status === "approved" || status === "active")
            action = "SELLER_APPROVED";
        else if (status === "rejected")
            action = "SELLER_REJECTED";
        else if (status === "suspended")
            action = "SELLER_SUSPENDED";
        else if (status === "needs_correction")
            action = "SELLER_NEEDS_CORRECTION";
        else if (status === "pending" ||
            (currentStatus === "suspended" && (status === "approved" || status === "active")))
            action = "SELLER_REACTIVATED";
        const targetStatus = status === "active" ? "approved" : status;
        const isActive = targetStatus === "approved";
        // 1. Update seller profile
        const success = await seller_repository_js_1.sellerRepository.updateStatus(sellerId, targetStatus);
        if (!success)
            throw errors_js_1.Errors.database("Failed to update seller status.");
        await seller_repository_js_1.sellerRepository.updateProfile(sellerId, {
            status: targetStatus,
            is_active: isActive,
        });
        // 2. Update user_profiles role if approved
        if (isActive) {
            try {
                const db = (await import("../config/database.js")).getAdminDb();
                const targetUserId = seller.user_id;
                if (targetUserId) {
                    await db.from("user_profiles").update({ role: "seller" }).eq("id", targetUserId);
                }
            }
            catch {
                // Continue
            }
        }
        // 3. Update seller application record if present
        const { sellerAuthRepository } = await import("../database/repositories/seller-auth.repository.js");
        const app = await sellerAuthRepository.findApplicationBySellerId(sellerId);
        if (app) {
            await sellerAuthRepository.updateApplicationStatus(app.id, {
                status: targetStatus,
                reviewed_by: adminUserId,
                reviewed_at: new Date().toISOString(),
                rejection_reason: targetStatus === "rejected" ? reason || "Application rejected by administrator." : null,
                correction_reason: targetStatus === "needs_correction" ? reason || "Application requires additional information." : null,
            });
        }
        // 4. Log detailed audit record
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action,
            resource_type: "seller_profile",
            resource_id: sellerId,
            metadata: { from: currentStatus, to: targetStatus, reason: reason || null },
        });
        // 5. Trigger notification to seller user
        if (seller.user_id) {
            try {
                const { notificationService } = await import("../notifications/notification.service.js");
                let message = "";
                let title = "";
                if (targetStatus === "approved") {
                    title = "Nursery Application Approved";
                    message = "Your Floria seller account has been approved. You can now log in and start selling.";
                }
                else if (targetStatus === "rejected") {
                    title = "Nursery Application Update";
                    message = reason ? `Your Floria seller application was not approved: ${reason}` : "Your Floria seller application was not approved.";
                }
                else if (targetStatus === "needs_correction") {
                    title = "Action Required on Seller Application";
                    message = reason ? `Your application requires correction: ${reason}` : "Please update your nursery application details.";
                }
                else {
                    title = "Nursery Partner Account Update";
                    message = "Your Floria nursery seller account has been suspended.";
                }
                await notificationService.createNotification({
                    user_id: seller.user_id,
                    role: "seller",
                    type: `SELLER_${targetStatus.toUpperCase()}`,
                    title,
                    message,
                    source_type: "seller_profile",
                    source_id: `${sellerId}_${targetStatus}`,
                    navigation: {
                        entityType: "SELLER",
                        entityId: sellerId,
                        action: "VIEW",
                    },
                });
            }
            catch (notifErr) {
                console.error("[AdminService] Seller status notification error:", notifErr);
            }
        }
        return { id: sellerId, status: targetStatus, reason };
    }
    async getSellerDocuments(sellerId) {
        const seller = await seller_repository_js_1.sellerRepository.findById(sellerId);
        if (!seller)
            throw errors_js_1.Errors.notFound("Seller profile");
        return {
            sellerId,
            documents: [
                {
                    type: "nursery_license",
                    url: "/documents/sample_license.pdf",
                    status: "verified",
                },
                {
                    type: "gst_certificate",
                    url: "/documents/sample_gst.pdf",
                    status: "verified",
                },
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
    async getOrders(_adminUserId, filters) {
        return order_repository_js_1.orderRepository.findAllMasterOrders(filters);
    }
    async getOrderById(_adminUserId, id) {
        const order = await order_repository_js_1.orderRepository.findById(id);
        if (!order)
            throw errors_js_1.Errors.notFound("Master order");
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
                const key = d.toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                });
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
                const key = d.toLocaleString("default", {
                    day: "numeric",
                    month: "short",
                });
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
    async updateUser(adminUserId, userId, updates) {
        const user = await user_repository_js_1.userRepository.updateProfile(userId, updates);
        if (!user)
            throw errors_js_1.Errors.notFound("User");
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "USER_PROFILE_UPDATED",
            resource_type: "user",
            resource_id: userId,
            metadata: updates,
        });
        return user;
    }
    async updateSeller(adminUserId, sellerId, updates) {
        const seller = await seller_repository_js_1.sellerRepository.updateProfile(sellerId, updates);
        if (!seller)
            throw errors_js_1.Errors.notFound("Seller");
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "SELLER_PROFILE_UPDATED",
            resource_type: "seller",
            resource_id: sellerId,
            metadata: updates,
        });
        return seller;
    }
    async updateProduct(adminUserId, productId, updates) {
        const existing = await product_repository_js_1.productRepository.findById(productId);
        if (!existing)
            throw errors_js_1.Errors.notFound("Product");
        const db = (0, database_js_1.getAdminDb)();
        const now = new Date().toISOString();
        const prodPayload = { updated_at: now };
        if (updates.name !== undefined)
            prodPayload.name = updates.name.trim();
        if (updates.category_id !== undefined)
            prodPayload.category_id = updates.category_id;
        if (updates.description !== undefined)
            prodPayload.description = updates.description?.trim() || null;
        if (updates.status !== undefined)
            prodPayload.status = updates.status;
        const { data: updatedProd, error: prodErr } = await db
            .from("products")
            .update(prodPayload)
            .eq("id", productId)
            .select()
            .maybeSingle();
        if (prodErr)
            throw prodErr;
        // Update Inventory
        if (updates.price_paise !== undefined ||
            updates.stock_quantity !== undefined ||
            updates.sku !== undefined) {
            const invPayload = { updated_at: now };
            if (updates.price_paise !== undefined)
                invPayload.price_paise = Math.max(0, updates.price_paise);
            if (updates.stock_quantity !== undefined)
                invPayload.stock_quantity = Math.max(0, updates.stock_quantity);
            if (updates.sku !== undefined)
                invPayload.sku = updates.sku?.trim() || null;
            await db.from("inventory").update(invPayload).eq("product_id", productId);
        }
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "PRODUCT_CATALOG_UPDATED",
            resource_type: "product",
            resource_id: productId,
            metadata: updates,
        });
        return product_repository_js_1.productRepository.findById(productId);
    }
    async updateOrder(adminUserId, orderId, updates) {
        const existing = await order_repository_js_1.orderRepository.findById(orderId);
        if (!existing)
            throw errors_js_1.Errors.notFound("Order");
        if (updates.status !== undefined) {
            await order_repository_js_1.orderRepository.updateOrderStatus(orderId, updates.status);
        }
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: adminUserId,
            actor_role: "admin",
            action: "ORDER_STATUS_OVERRIDDEN",
            resource_type: "order",
            resource_id: orderId,
            metadata: updates,
        });
        return order_repository_js_1.orderRepository.findById(orderId);
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
