"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellersService = exports.SellersService = void 0;
// Floria API — Seller Portal Service
const seller_repository_js_1 = require("../database/repositories/seller.repository.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const policy_service_js_1 = require("../pricing/policy.service.js");
const pricing_service_js_1 = require("../pricing/pricing.service.js");
const database_js_1 = require("../config/database.js");
const errors_js_1 = require("../utils/errors.js");
class SellersService {
    async getProfile(userId) {
        let profile = await seller_repository_js_1.sellerRepository.findByUserId(userId);
        if (!profile) {
            // Auto-provision seller profile for authenticated user if missing
            try {
                const { getAdminDb } = await import("../config/database.js");
                const db = getAdminDb();
                const { data: userProf } = await db
                    .from("user_profiles")
                    .select("id, full_name, email, role")
                    .eq("id", userId)
                    .maybeSingle();
                profile = await seller_repository_js_1.sellerRepository.submitApplication(userId, {
                    business_name: userProf?.full_name || "Nursery Partner",
                    contact_email: userProf?.email || "",
                    contact_phone: "",
                    address: "",
                    business_description: "Registered seller account.",
                });
            }
            catch (e) {
                console.error("[SellersService] Auto-provision seller profile error:", e);
            }
        }
        if (!profile) {
            throw errors_js_1.Errors.notFound("Seller profile not found. Please complete partner application.");
        }
        return profile;
    }
    async getApplication(userId) {
        const profile = await seller_repository_js_1.sellerRepository.findByUserId(userId);
        if (profile) {
            const isComplete = !!(profile.business_name &&
                profile.business_name !== "Nursery Partner" &&
                profile.business_name !== "New Nursery" &&
                profile.contact_phone?.trim() &&
                profile.address?.trim());
            return { ...profile, is_complete: isComplete };
        }
        // If no seller_profile row exists, retrieve user email/name from user_profiles to pre-fill
        try {
            const { getAdminDb } = await import("../config/database.js");
            const db = getAdminDb();
            const { data: userProf } = await db
                .from("user_profiles")
                .select("full_name, email")
                .eq("id", userId)
                .maybeSingle();
            return {
                business_name: userProf?.full_name || "",
                contact_email: userProf?.email || "",
                contact_phone: "",
                address: "",
                business_description: "",
                is_complete: false,
            };
        }
        catch {
            return {
                business_name: "",
                contact_email: "",
                contact_phone: "",
                address: "",
                business_description: "",
                is_complete: false,
            };
        }
    }
    async updateProfile(userId, updates) {
        const profile = await this.getProfile(userId);
        // Server-side validation
        if (updates.business_name !== undefined &&
            updates.business_name !== null &&
            !updates.business_name.trim()) {
            throw errors_js_1.Errors.validation("Business name is required");
        }
        if (updates.contact_phone !== undefined &&
            updates.contact_phone !== null &&
            updates.contact_phone.trim()) {
            const cleanPhone = updates.contact_phone
                .replace(/[\s\-+()\u00a0]/g, "")
                .replace(/^91/, "");
            if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
                throw errors_js_1.Errors.validation("Invalid phone number format (must be 10 digits)");
            }
        }
        if (updates.whatsapp_number !== undefined &&
            updates.whatsapp_number !== null &&
            updates.whatsapp_number.trim()) {
            const cleanWhatsapp = updates.whatsapp_number
                .replace(/[\s\-+()\u00a0]/g, "")
                .replace(/^91/, "");
            if (!/^[6-9]\d{9}$/.test(cleanWhatsapp)) {
                throw errors_js_1.Errors.validation("Invalid WhatsApp number format (must be 10 digits)");
            }
        }
        if (updates.alternate_phone !== undefined &&
            updates.alternate_phone !== null &&
            updates.alternate_phone.trim()) {
            const cleanAlt = updates.alternate_phone
                .replace(/[\s\-+()\u00a0]/g, "")
                .replace(/^91/, "");
            if (!/^[6-9]\d{9}$/.test(cleanAlt)) {
                throw errors_js_1.Errors.validation("Invalid alternate phone number format (must be 10 digits)");
            }
        }
        if (updates.contact_email !== undefined &&
            updates.contact_email !== null &&
            updates.contact_email.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.contact_email.trim())) {
                throw errors_js_1.Errors.validation("Invalid email address format");
            }
        }
        if (updates.pincode !== undefined &&
            updates.pincode !== null &&
            updates.pincode.trim()) {
            if (!/^\d{6}$/.test(updates.pincode.trim())) {
                throw errors_js_1.Errors.validation("Invalid Indian PIN code (must be 6 digits)");
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
        const name = appData.business_name?.trim();
        if (!name || name === "Nursery Partner" || name === "New Nursery") {
            throw errors_js_1.Errors.validation("Nursery / Business name is required.");
        }
        const email = appData.contact_email?.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw errors_js_1.Errors.validation("Valid contact email address is required.");
        }
        const phoneRaw = appData.contact_phone?.trim();
        if (!phoneRaw) {
            throw errors_js_1.Errors.validation("Contact phone number is required.");
        }
        const cleanPhone = phoneRaw
            .replace(/[\s\-+()\u00a0]/g, "")
            .replace(/^91/, "");
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            throw errors_js_1.Errors.validation("Invalid 10-digit Indian phone number format.");
        }
        const address = appData.address?.trim();
        if (!address) {
            throw errors_js_1.Errors.validation("Nursery location / address is required.");
        }
        const profile = await seller_repository_js_1.sellerRepository.submitApplication(userId, {
            ...appData,
            business_name: name,
            contact_email: email,
            contact_phone: cleanPhone,
            address: address,
            business_description: appData.business_description?.trim() || "",
        });
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: userId,
            actor_role: "seller",
            action: "SELLER_APPLICATION_SUBMITTED",
            resource_type: "seller_profile",
            resource_id: profile.id,
        });
        return profile;
    }
    async getProducts(sellerId, filters) {
        const products = await seller_repository_js_1.sellerRepository.findSellerProducts(sellerId, filters);
        const { productsService } = await import("../products/products.service.js");
        const settings = await pricing_service_js_1.pricingService.getFinancialSettings();
        return products.map((p) => productsService.enrichWithDbPricing(p, settings));
    }
    async getProductById(sellerId, productId) {
        const prod = await seller_repository_js_1.sellerRepository.findSellerProductById(sellerId, productId);
        if (!prod)
            throw errors_js_1.Errors.notFound("Product");
        const { productsService } = await import("../products/products.service.js");
        const settings = await pricing_service_js_1.pricingService.getFinancialSettings();
        return productsService.enrichWithDbPricing(prod, settings);
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
    async attachProductImage(sellerProfile, productId, payload) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot attach media assets to products");
        }
        const { ProductMediaService } = await import("../products/product-media.service.js");
        return ProductMediaService.attachMediaAssetToProduct(sellerProfile.id, productId, payload);
    }
    async removeProductImage(sellerProfile, productId, imageId) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot remove product images");
        }
        const { ProductMediaService } = await import("../products/product-media.service.js");
        return ProductMediaService.removeProductImage(sellerProfile.id, productId, imageId);
    }
    async reorderProductImages(sellerProfile, productId, imageOrders) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot reorder product images");
        }
        const { ProductMediaService } = await import("../products/product-media.service.js");
        return ProductMediaService.reorderProductImages(sellerProfile.id, productId, imageOrders);
    }
    async setPrimaryProductImage(sellerProfile, productId, imageId) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot change primary product image");
        }
        const { ProductMediaService } = await import("../products/product-media.service.js");
        return ProductMediaService.setPrimaryProductImage(sellerProfile.id, productId, imageId);
    }
    async replaceProductImage(sellerProfile, productId, imageId, payload) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot replace product images");
        }
        const { ProductMediaService } = await import("../products/product-media.service.js");
        return ProductMediaService.replaceProductImage(sellerProfile.id, productId, imageId, payload.assetId, payload);
    }
    async getInventory(sellerId) {
        return seller_repository_js_1.sellerRepository.findSellerInventory(sellerId);
    }
    async updateInventory(sellerProfile, productId, updates) {
        if (sellerProfile.status !== "approved") {
            throw errors_js_1.Errors.forbidden("Pending or suspended sellers cannot update inventory");
        }
        if (updates.stock_quantity !== undefined &&
            typeof updates.stock_quantity === "number" &&
            updates.stock_quantity < 0) {
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
        // Automatically recalculate product_pricing read model on seller base price updates
        try {
            const newBase = updates.base_price_paise ?? updates.price_paise;
            if (typeof newBase === "number" && newBase > 0) {
                const activePolicy = await policy_service_js_1.policyService.getActivePolicy();
                if (activePolicy) {
                    const calc = pricing_service_js_1.pricingService.calculateProductPricingSync(newBase, {
                        sellerCommissionRate: activePolicy.sellerCommissionRate,
                        floriaProfitRate: activePolicy.floriaProfitRate,
                        platformMaintenanceFeePaise: activePolicy.platformMaintenanceFeePaise,
                        freeDeliveryThresholdPaise: activePolicy.freeDeliveryThresholdPaise,
                        freeDeliveryRecoveryPaise: activePolicy.freeDeliveryRecoveryPaise,
                    });
                    const db = (0, database_js_1.getAdminDb)();
                    await db.from("product_pricing").upsert({
                        product_id: productId,
                        seller_id: sellerProfile.id,
                        policy_version_id: activePolicy.id,
                        seller_base_price_paise: calc.sellerBasePricePaise,
                        floria_profit_rate: calc.floriaProfitRate,
                        floria_profit_paise: calc.floriaProfitPaise,
                        delivery_recovery_paise: calc.deliveryRecoveryPaise,
                        customer_product_price_paise: calc.customerProductPricePaise,
                        is_free_delivery_eligible: calc.isFreeDeliveryEligible,
                        seller_commission_rate: calc.sellerCommissionRate,
                        seller_commission_paise: calc.sellerCommissionPaise,
                        seller_net_paise: calc.sellerNetPaise,
                        is_override: false,
                        updated_at: new Date().toISOString(),
                    }, { onConflict: "policy_version_id,product_id" });
                }
            }
        }
        catch (e) {
            console.warn("[SellersService] Read model sync warning:", e?.message);
        }
        // Notification check for low / out of stock
        try {
            if (updates.stock_quantity !== undefined &&
                typeof updates.stock_quantity === "number") {
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
                        navigation: {
                            entityType: "PRODUCT",
                            entityId: productId,
                            action: "VIEW",
                        },
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
                        navigation: {
                            entityType: "PRODUCT",
                            entityId: productId,
                            action: "VIEW",
                        },
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
                const { data: order } = await db
                    .from("orders")
                    .select("customer_id")
                    .eq("id", masterOrderId)
                    .maybeSingle();
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
                        navigation: {
                            entityType: "ORDER",
                            entityId: masterOrderId,
                            action: "VIEW",
                        },
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
        const ALLOWED_MIME_TYPES = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];
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
            metadata: {
                documentType: payload.documentType,
                fileName: payload.fileName,
            },
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
