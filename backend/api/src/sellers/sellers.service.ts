// Floria API — Seller Portal Service
import { sellerRepository } from "../database/repositories/seller.repository.js";
import { auditRepository } from "../database/repositories/audit.repository.js";
import { Errors } from "../utils/errors.js";
import type { SellerProfile } from "@floria/types";

export class SellersService {
  async getProfile(userId: string): Promise<SellerProfile> {
    const profile = await sellerRepository.findByUserId(userId);
    if (!profile) throw Errors.notFound("Seller profile");
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<SellerProfile>): Promise<SellerProfile> {
    const profile = await this.getProfile(userId);
    const updated = await sellerRepository.updateProfile(profile.id, updates);
    if (!updated) throw Errors.notFound("Seller profile");

    await auditRepository.log({
      actor_user_id: userId,
      actor_role: "seller",
      action: "SELLER_PROFILE_UPDATED",
      resource_type: "seller_profile",
      resource_id: profile.id,
      metadata: { updatedFields: Object.keys(updates) },
    });

    return updated;
  }

  async submitApplication(userId: string, appData: any): Promise<SellerProfile> {
    const profile = await sellerRepository.submitApplication(userId, appData);
    await auditRepository.log({
      actor_user_id: userId,
      actor_role: "seller",
      action: "SELLER_APPLICATION_SUBMITTED",
      resource_type: "seller_profile",
      resource_id: profile.id,
    });
    return profile;
  }

  async getApplication(userId: string): Promise<SellerProfile | null> {
    return sellerRepository.findByUserId(userId);
  }

  async getProducts(sellerId: string, filters?: { search?: string; status?: string; stock?: string }) {
    return sellerRepository.findSellerProducts(sellerId, filters);
  }

  async getProductById(sellerId: string, productId: string) {
    const prod = await sellerRepository.findSellerProductById(sellerId, productId);
    if (!prod) throw Errors.notFound("Product");
    return prod;
  }

  async createProduct(sellerProfile: SellerProfile, productData: any) {
    if (sellerProfile.status !== "approved") {
      throw Errors.forbidden("Pending or suspended sellers cannot create products");
    }
    const created = await sellerRepository.createProduct(sellerProfile.id, productData);
    await auditRepository.log({
      actor_user_id: sellerProfile.user_id,
      actor_role: "seller",
      action: "SELLER_PRODUCT_CREATED",
      resource_type: "product",
      resource_id: created.id,
    });
    return created;
  }

  async updateProduct(sellerProfile: SellerProfile, productId: string, updates: any) {
    if (sellerProfile.status !== "approved") {
      throw Errors.forbidden("Pending or suspended sellers cannot edit products");
    }
    const updated = await sellerRepository.updateProduct(sellerProfile.id, productId, updates);
    if (!updated) throw Errors.notFound("Product");

    await auditRepository.log({
      actor_user_id: sellerProfile.user_id,
      actor_role: "seller",
      action: "SELLER_PRODUCT_UPDATED",
      resource_type: "product",
      resource_id: productId,
    });

    return updated;
  }

  async updateProductStatus(sellerProfile: SellerProfile, productId: string, status: "active" | "draft" | "inactive") {
    if (sellerProfile.status !== "approved") {
      throw Errors.forbidden("Pending or suspended sellers cannot change product status");
    }
    const updated = await sellerRepository.updateProductStatus(sellerProfile.id, productId, status);
    if (!updated) throw Errors.notFound("Product");

    await auditRepository.log({
      actor_user_id: sellerProfile.user_id,
      actor_role: "seller",
      action: `SELLER_PRODUCT_${status.toUpperCase()}`,
      resource_type: "product",
      resource_id: productId,
    });

    return updated;
  }

  async deleteProduct(sellerProfile: SellerProfile, productId: string) {
    if (sellerProfile.status !== "approved") {
      throw Errors.forbidden("Pending or suspended sellers cannot delete products");
    }
    const success = await sellerRepository.deleteProduct(sellerProfile.id, productId);
    if (!success) throw Errors.notFound("Product");

    await auditRepository.log({
      actor_user_id: sellerProfile.user_id,
      actor_role: "seller",
      action: "SELLER_PRODUCT_DELETED",
      resource_type: "product",
      resource_id: productId,
    });

    return { success: true };
  }

  async getInventory(sellerId: string) {
    return sellerRepository.findSellerInventory(sellerId);
  }

  async updateInventory(sellerProfile: SellerProfile, productId: string, updates: any) {
    if (sellerProfile.status !== "approved") {
      throw Errors.forbidden("Pending or suspended sellers cannot update inventory");
    }

    if (updates.stock_quantity !== undefined && typeof updates.stock_quantity === "number" && updates.stock_quantity < 0) {
      throw Errors.validation("Stock quantity cannot be negative");
    }

    const updated = await sellerRepository.updateProduct(sellerProfile.id, productId, updates);
    if (!updated) throw Errors.notFound("Product inventory");

    await auditRepository.log({
      actor_user_id: sellerProfile.user_id,
      actor_role: "seller",
      action: "SELLER_INVENTORY_UPDATED",
      resource_type: "inventory",
      resource_id: productId,
      metadata: updates,
    });

    return updated;
  }

  async getOrders(sellerId: string, filters?: { status?: string; search?: string }) {
    return sellerRepository.findSellerOrders(sellerId, filters);
  }

  async getOrderById(sellerId: string, orderId: string) {
    const orderView = await sellerRepository.findSellerOrderById(sellerId, orderId);
    if (!orderView) throw Errors.notFound("Order");
    return orderView;
  }

  async updateFulfillment(sellerProfile: SellerProfile, masterOrderId: string, newStatus: string) {
    if (sellerProfile.status !== "approved") {
      throw Errors.forbidden("Pending or suspended sellers cannot fulfill orders");
    }
    try {
      const result = await sellerRepository.updateFulfillmentStatus(sellerProfile.id, masterOrderId, newStatus);
      await auditRepository.log({
        actor_user_id: sellerProfile.user_id,
        actor_role: "seller",
        action: "SELLER_FULFILLMENT_UPDATED",
        resource_type: "seller_order_fulfillment",
        resource_id: masterOrderId,
        metadata: { status: newStatus },
      });
      return result;
    } catch (e: any) {
      throw Errors.validation(e.message || "Invalid status transition");
    }
  }

  async getDashboard(sellerId: string) {
    return sellerRepository.getDashboard(sellerId);
  }

  async getEarnings(sellerId: string) {
    return sellerRepository.getEarnings(sellerId);
  }

  async getPayouts(sellerId: string) {
    return sellerRepository.getPayouts(sellerId);
  }

  async getAnalytics(sellerId: string, range: string) {
    return sellerRepository.getAnalytics(sellerId, range);
  }
}

export const sellersService = new SellersService();
