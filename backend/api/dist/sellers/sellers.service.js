"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellersService = exports.SellersService = void 0;
// Floria API — Seller Portal Service
const seller_repository_js_1 = require("../database/repositories/seller.repository.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const errors_js_1 = require("../utils/errors.js");
class SellersService {
    async getProfile(userId) {
        let profile = await seller_repository_js_1.sellerRepository.findByUserId(userId);
        if (!profile) {
            // Auto-provision seller profile if user exists in user_profiles
            try {
                const { getAdminDb } = await import("../config/database.js");
                const db = getAdminDb();
                const { data: userProf } = await db.from("user_profiles").select("id, full_name, email, role").eq("id", userId).maybeSingle();
                if (userProf) {
                    profile = await seller_repository_js_1.sellerRepository.submitApplication(userId, {
                        business_name: userProf.full_name || "Nursery Partner",
                        contact_email: userProf.email || "",
                        contact_phone: "",
                        address: "",
                        business_description: "Registered seller account.",
                    });
                }
            }
            catch (e) {
                console.error("[SellersService] Auto-provision seller profile error:", e);
            }
        }
        if (!profile)
            throw errors_js_1.Errors.notFound("Seller profile");
        return profile;
    }
    async updateProfile(userId, updates) {
        const profile = await this.getProfile(userId);
        // Server-side validation
        if (updates.business_name !== undefined && updates.business_name !== null && !updates.business_name.trim()) {
            throw errors_js_1.Errors.validation("Business name is required");
        }
        if (updates.contact_phone !== undefined && updates.contact_phone !== null) {
            const cleanPhone = updates.contact_phone.replace(/[\s\-+()\u00a0]/g, "").replace(/^91/, "");
            if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
                throw errors_js_1.Errors.validation("Invalid phone number format");
            }
        }
        if (updates.contact_email !== undefined && updates.contact_email !== null) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.contact_email.trim())) {
                throw errors_js_1.Errors.validation("Invalid email address format");
            }
        }
        const updated = await seller_repository_js_1.sellerRepository.updateProfile(profile.id, updates);
        if (!updated)
            throw errors_js_1.Errors.notFound("Seller profile");
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: userId,
            actor_role: "seller",
            action: "SELLER_PROFILE_UPDATED",
            resource_type: "seller_profile",
            resource_id: profile.id,
            metadata: { updatedFields: Object.keys(updates) },
        });
        return updated;
    }
    async submitApplication(userId, appData) {
        const profile = await seller_repository_js_1.sellerRepository.submitApplication(userId, appData);
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: userId,
            actor_role: "seller",
            action: "SELLER_APPLICATION_SUBMITTED",
            resource_type: "seller_profile",
            resource_id: profile.id,
        });
        return profile;
    }
    async getApplication(userId) {
        return seller_repository_js_1.sellerRepository.findByUserId(userId);
    }
    async getProducts(sellerId, filters) {
        return seller_repository_js_1.sellerRepository.findSellerProducts(sellerId, filters);
    }
    async getProductById(sellerId, productId) {
        const prod = await seller_repository_js_1.sellerRepository.findSellerProductById(sellerId, productId);
        if (!prod)
            throw errors_js_1.Errors.notFound("Product");
        return prod;
    }
    async createProduct(sellerProfile, productData) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot create products");
        }
        const created = await seller_repository_js_1.sellerRepository.createProduct(sellerProfile.id, productData);
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: sellerProfile.user_id,
            actor_role: "seller",
            action: "SELLER_PRODUCT_CREATED",
            resource_type: "product",
            resource_id: created.id,
        });
        return created;
    }
    async updateProduct(sellerProfile, productId, updates) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot edit products");
        }
        const updated = await seller_repository_js_1.sellerRepository.updateProduct(sellerProfile.id, productId, updates);
        if (!updated)
            throw errors_js_1.Errors.notFound("Product");
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: sellerProfile.user_id,
            actor_role: "seller",
            action: "SELLER_PRODUCT_UPDATED",
            resource_type: "product",
            resource_id: productId,
        });
        return updated;
    }
    async updateProductStatus(sellerProfile, productId, status) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot change product status");
        }
        const updated = await seller_repository_js_1.sellerRepository.updateProductStatus(sellerProfile.id, productId, status);
        if (!updated)
            throw errors_js_1.Errors.notFound("Product");
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: sellerProfile.user_id,
            actor_role: "seller",
            action: `SELLER_PRODUCT_${status.toUpperCase()}`,
            resource_type: "product",
            resource_id: productId,
        });
        return updated;
    }
    async deleteProduct(sellerProfile, productId) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot delete products");
        }
        const success = await seller_repository_js_1.sellerRepository.deleteProduct(sellerProfile.id, productId);
        if (!success)
            throw errors_js_1.Errors.notFound("Product");
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: sellerProfile.user_id,
            actor_role: "seller",
            action: "SELLER_PRODUCT_DELETED",
            resource_type: "product",
            resource_id: productId,
        });
        return { success: true };
    }
    async getInventory(sellerId) {
        return seller_repository_js_1.sellerRepository.findSellerInventory(sellerId);
    }
    async updateInventory(sellerProfile, productId, updates) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot update inventory");
        }
        if (updates.stock_quantity !== undefined && typeof updates.stock_quantity === "number" && updates.stock_quantity < 0) {
            throw errors_js_1.Errors.validation("Stock quantity cannot be negative");
        }
        const updated = await seller_repository_js_1.sellerRepository.updateProduct(sellerProfile.id, productId, updates);
        if (!updated)
            throw errors_js_1.Errors.notFound("Product inventory");
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: sellerProfile.user_id,
            actor_role: "seller",
            action: "SELLER_INVENTORY_UPDATED",
            resource_type: "inventory",
            resource_id: productId,
            metadata: updates,
        });
        // Notification check for low / out of stock
        try {
            if (updates.stock_quantity !== undefined && typeof updates.stock_quantity === "number") {
                const threshold = updated.low_stock_threshold ?? 5;
                const { notificationService } = await import("../notifications/notification.service.js");
                if (updates.stock_quantity <= 0) {
                    await notificationService.createNotification({
                        user_id: sellerProfile.user_id,
                        role: "seller",
                        type: "OUT_OF_STOCK",
                        title: "Item Out of Stock",
                        message: `Your product "${updated.name}" is now completely out of stock.`,
                        data: { productId, stockQuantity: 0 },
                        source_type: "inventory",
                        source_id: `${productId}_out_of_stock`,
                    });
                }
                else if (updates.stock_quantity <= threshold) {
                    await notificationService.createNotification({
                        user_id: sellerProfile.user_id,
                        role: "seller",
                        type: "LOW_STOCK",
                        title: "Low Stock Alert",
                        message: `Your product "${updated.name}" stock (${updates.stock_quantity}) has reached low threshold.`,
                        data: { productId, stockQuantity: updates.stock_quantity },
                        source_type: "inventory",
                        source_id: `${productId}_low_stock`,
                    });
                }
            }
        }
        catch (notifErr) {
            console.error("[SellersService] Inventory notification error:", notifErr);
        }
        return updated;
    }
    async getOrders(sellerId, filters) {
        return seller_repository_js_1.sellerRepository.findSellerOrders(sellerId, filters);
    }
    async getOrderById(sellerId, orderId) {
        const orderView = await seller_repository_js_1.sellerRepository.findSellerOrderById(sellerId, orderId);
        if (!orderView)
            throw errors_js_1.Errors.notFound("Order");
        return orderView;
    }
    async updateFulfillment(sellerProfile, masterOrderId, newStatus) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot fulfill orders");
        }
        try {
            const result = await seller_repository_js_1.sellerRepository.updateFulfillmentStatus(sellerProfile.id, masterOrderId, newStatus);
            await audit_repository_js_1.auditRepository.log({
                actor_user_id: sellerProfile.user_id,
                actor_role: "seller",
                action: "SELLER_FULFILLMENT_UPDATED",
                resource_type: "seller_order_fulfillment",
                resource_id: masterOrderId,
                metadata: { status: newStatus },
            });
            // Notification trigger for order fulfillment update
            try {
                const { notificationService } = await import("../notifications/notification.service.js");
                const { getAdminDb } = await import("../config/database.js");
                const db = getAdminDb();
                const { data: order } = await db.from("orders").select("customer_id").eq("id", masterOrderId).maybeSingle();
                if (order?.customer_id) {
                    await notificationService.createNotification({
                        user_id: order.customer_id,
                        role: "customer",
                        type: `ORDER_${newStatus.toUpperCase()}`,
                        title: `Order Update: ${newStatus.replace(/_/g, " ").toUpperCase()}`,
                        message: `Your nursery item status has been updated to "${newStatus.replace(/_/g, " ")}".`,
                        data: { orderId: masterOrderId, status: newStatus },
                        source_type: "fulfillment",
                        source_id: `${masterOrderId}_${newStatus}`,
                    });
                }
            }
            catch (notifErr) {
                console.error("[SellersService] Fulfillment notification error:", notifErr);
            }
            return result;
        }
        catch (e) {
            throw errors_js_1.Errors.validation(e.message || "Invalid status transition");
        }
    }
    async getDashboard(sellerId) {
        return seller_repository_js_1.sellerRepository.getDashboard(sellerId);
    }
    async getEarnings(sellerId) {
        return seller_repository_js_1.sellerRepository.getEarnings(sellerId);
    }
    async getPayouts(sellerId) {
        return seller_repository_js_1.sellerRepository.getPayouts(sellerId);
    }
    async getAnalytics(sellerId, range) {
        return seller_repository_js_1.sellerRepository.getAnalytics(sellerId, range);
    }
    // ── Documents ────────────────────────────────────────────────────────────
    async getDocuments(sellerId) {
        return seller_repository_js_1.sellerRepository.findSellerDocuments(sellerId);
    }
    async uploadDocument(sellerId, payload) {
        if (!payload.documentType || !payload.fileName || !payload.fileUrl) {
            throw errors_js_1.Errors.validation("documentType, fileName, and fileUrl are required");
        }
        const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
        const mime = (payload.mimeType || "").toLowerCase();
        if (mime && !ALLOWED_MIME_TYPES.includes(mime)) {
            throw errors_js_1.Errors.validation("Invalid document file type. Allowed: PDF, JPG, PNG, WebP.");
        }
        const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
        if (payload.fileSize && payload.fileSize > MAX_SIZE_BYTES) {
            throw errors_js_1.Errors.validation("File size exceeds maximum limit of 5 MB");
        }
        const doc = await seller_repository_js_1.sellerRepository.insertSellerDocument({
            seller_id: sellerId,
            document_type: payload.documentType,
            file_name: payload.fileName,
            file_url: payload.fileUrl,
            file_size_bytes: payload.fileSize || 0,
            mime_type: mime || "application/pdf",
        });
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: sellerId,
            actor_role: "seller",
            action: "SELLER_DOCUMENT_UPLOADED",
            resource_type: "seller_document",
            resource_id: doc.id,
            metadata: { documentType: payload.documentType, fileName: payload.fileName },
        });
        return doc;
    }
    // ── Settings ─────────────────────────────────────────────────────────────
    async getNotificationSettings(sellerId) {
        return seller_repository_js_1.sellerRepository.findSellerSettings(sellerId);
    }
    async updateNotificationSettings(sellerId, updates) {
        const updated = await seller_repository_js_1.sellerRepository.updateSellerSettings(sellerId, updates);
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: sellerId,
            actor_role: "seller",
            action: "SELLER_NOTIFICATION_SETTINGS_UPDATED",
            resource_type: "seller_settings",
            resource_id: sellerId,
            metadata: updates,
        });
        return updated;
    }
}
exports.SellersService = SellersService;
exports.sellersService = new SellersService();
