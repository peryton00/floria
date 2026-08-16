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

    // Server-side validation
    if (updates.business_name !== undefined && updates.business_name !== null && !updates.business_name.trim()) {
      throw Errors.validation("Business name is required");
    }
    if (updates.contact_phone !== undefined && updates.contact_phone !== null) {
      const cleanPhone = updates.contact_phone.replace(/[\s\-+()\u00a0]/g, "").replace(/^91/, "");
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        throw Errors.validation("Invalid phone number format");
      }
    }
    if (updates.contact_email !== undefined && updates.contact_email !== null) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.contact_email.trim())) {
        throw Errors.validation("Invalid email address format");
      }
    }

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
        } else if (updates.stock_quantity <= threshold) {
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
    } catch (notifErr) {
      console.error("[SellersService] Inventory notification error:", notifErr);
    }

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
      } catch (notifErr) {
        console.error("[SellersService] Fulfillment notification error:", notifErr);
      }

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
