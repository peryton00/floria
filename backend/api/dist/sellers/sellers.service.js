"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellersService = exports.SellersService = void 0;
// Floria API — Seller Portal Service
const seller_repository_js_1 = require("../database/repositories/seller.repository.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const errors_js_1 = require("../utils/errors.js");
class SellersService {
    async getProfile(userId) {
        const profile = await seller_repository_js_1.sellerRepository.findByUserId(userId);
        if (!profile)
            throw errors_js_1.Errors.notFound("Seller profile");
        return profile;
    }
    async updateProfile(userId, updates) {
        const profile = await this.getProfile(userId);
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
}
exports.SellersService = SellersService;
exports.sellersService = new SellersService();
