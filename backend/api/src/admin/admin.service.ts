// Floria API — Admin Service
import { userRepository } from "../database/repositories/user.repository.js";
import { sellerRepository } from "../database/repositories/seller.repository.js";
import { productRepository } from "../database/repositories/product.repository.js";
import { categoryRepository } from "../database/repositories/category.repository.js";
import { orderRepository } from "../database/repositories/order.repository.js";
import { auditRepository } from "../database/repositories/audit.repository.js";
import { Errors } from "../utils/errors.js";
import { getAdminDb } from "../config/database.js";

export class AdminService {
  async getDashboard() {
    const [users, sellers, prods, orders] = await Promise.all([
      userRepository.findAll(1000),
      sellerRepository.findAll(),
      productRepository.findAll(),
      orderRepository.findAllMasterOrders(),
    ]);

    const { settingsRepository } =
      await import("../database/repositories/settings.repository.js");
    const commissionRate = await settingsRepository.getCommissionRate();

    const totalCustomers = users.filter(
      (u: any) => u.role === "customer",
    ).length;
    const totalSellers = sellers.length;
    const pendingSellerApplications = sellers.filter(
      (s: any) => s.status === "pending",
    ).length;
    const approvedSellers = sellers.filter(
      (s: any) => s.status === "approved",
    ).length;
    const suspendedSellers = sellers.filter(
      (s: any) => s.status === "suspended",
    ).length;

    const totalProducts = prods.length;
    const activeProducts = prods.filter(
      (p: any) => p.status === "active",
    ).length;
    const draftProducts = prods.filter((p: any) => p.status === "draft").length;
    const outOfStockProducts = prods.filter((p: any) => {
      const qty =
        p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
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

    orders.forEach((o: any) => {
      const st = (o.status || "").toLowerCase();
      if (st === "order placed" || st === "nursery confirmed") pendingOrders++;
      else if (st === "preparing") preparingOrders++;
      else if (st === "ready for pickup" || st === "picked up")
        readyForPickupOrders++;
      else if (st === "packing" || st === "out for delivery")
        outForDeliveryOrders++;
      else if (st === "delivered") deliveredOrders++;
      else if (st === "cancelled") cancelledOrders++;

      totalOrderValue += o.subtotal_paise || 0;
      (o.order_items || []).forEach((item: any) => {
        totalItemsSold += item.quantity || 1;
      });
    });

    const platformRevenue = Math.round(
      totalOrderValue * (commissionRate / 100),
    );

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
  async getUsers(options?: {
    limit?: number;
    offset?: number;
    page?: number;
    role?: string;
    search?: string;
  }) {
    return userRepository.findAll(options?.limit, options?.offset, options);
  }

  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw Errors.notFound("User");
    return user;
  }

  async updateUserStatus(
    adminUserId: string,
    userId: string,
    status: "active" | "suspended",
    rationale?: string,
  ) {
    const user = await userRepository.findById(userId);
    if (!user) throw Errors.notFound("User");

    const action =
      status === "suspended" ? "CUSTOMER_SUSPENDED" : "CUSTOMER_REACTIVATED";
    await auditRepository.log({
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
  async getSellers(status?: string) {
    return sellerRepository.findAll(status);
  }

  async getSellerById(id: string) {
    const seller = await sellerRepository.findById(id);
    if (!seller) throw Errors.notFound("Seller profile");
    return seller;
  }

  async getSellerApplications(status?: string) {
    const { sellerAuthRepository } = await import("../database/repositories/seller-auth.repository.js");
    return sellerAuthRepository.findAllApplications(status);
  }

  async updateSellerStatus(
    adminUserId: string,
    sellerId: string,
    status: "approved" | "suspended" | "pending" | "rejected" | "needs_correction" | "active",
    reason?: string,
  ) {
    const seller = await sellerRepository.findById(sellerId);
    if (!seller) throw Errors.notFound("Seller profile");

    const currentStatus = seller.status;

    if (currentStatus === "rejected" && status === "approved") {
      throw Errors.validation(
        "Cannot directly approve a rejected seller application without resubmission",
      );
    }

    let action = "SELLER_UPDATED";
    if (status === "approved" || status === "active") action = "SELLER_APPROVED";
    else if (status === "rejected") action = "SELLER_REJECTED";
    else if (status === "suspended") action = "SELLER_SUSPENDED";
    else if (status === "needs_correction") action = "SELLER_NEEDS_CORRECTION";
    else if (
      status === "pending" ||
      (currentStatus === "suspended" && (status === "approved" || status === "active"))
    )
      action = "SELLER_REACTIVATED";

    const targetStatus = status === "active" ? "approved" : status;
    const isActive = targetStatus === "approved";

    // 1. Update seller profile
    const success = await sellerRepository.updateStatus(
      sellerId,
      targetStatus as any,
    );
    if (!success) throw Errors.database("Failed to update seller status.");

    await sellerRepository.updateProfile(sellerId, {
      status: targetStatus as any,
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
      } catch {
        // Continue
      }
    }

    // 3. Update seller application record if present
    const { sellerAuthRepository } = await import("../database/repositories/seller-auth.repository.js");
    const app = await sellerAuthRepository.findApplicationBySellerId(sellerId);
    if (app) {
      await sellerAuthRepository.updateApplicationStatus(app.id, {
        status: targetStatus as any,
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: targetStatus === "rejected" ? reason || "Application rejected by administrator." : null,
        correction_reason: targetStatus === "needs_correction" ? reason || "Application requires additional information." : null,
      });
    }

    // 4. Log detailed audit record
    await auditRepository.log({
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
        const { notificationService } =
          await import("../notifications/notification.service.js");
        
        let message = "";
        let title = "";
        if (targetStatus === "approved") {
          title = "Nursery Application Approved";
          message = "Your Floria seller account has been approved. You can now log in and start selling.";
        } else if (targetStatus === "rejected") {
          title = "Nursery Application Update";
          message = reason ? `Your Floria seller application was not approved: ${reason}` : "Your Floria seller application was not approved.";
        } else if (targetStatus === "needs_correction") {
          title = "Action Required on Seller Application";
          message = reason ? `Your application requires correction: ${reason}` : "Please update your nursery application details.";
        } else {
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
      } catch (notifErr) {
        console.error(
          "[AdminService] Seller status notification error:",
          notifErr,
        );
      }
    }

    return { id: sellerId, status: targetStatus, reason };
  }

  async getSellerDocuments(sellerId: string) {
    const seller = await sellerRepository.findById(sellerId);
    if (!seller) throw Errors.notFound("Seller profile");

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
  async getProducts(filters?: {
    search?: string;
    status?: string;
    categoryId?: string;
    sellerId?: string;
  }) {
    return productRepository.findAll(filters);
  }

  async getProductById(id: string) {
    const prod = await productRepository.findById(id);
    if (!prod) throw Errors.notFound("Product");
    return prod;
  }

  async updateProductStatus(
    adminUserId: string,
    productId: string,
    status: string,
  ) {
    const prod = await productRepository.findById(productId);
    if (!prod) throw Errors.notFound("Product");

    let action = "PRODUCT_MODERATED";
    if (status === "active") action = "PRODUCT_PUBLISHED";
    else if (status === "inactive" || status === "draft")
      action = "PRODUCT_UNPUBLISHED";
    else if (status === "deleted" || status === "archived")
      action = "PRODUCT_ARCHIVED";

    const success = await productRepository.updateStatus(productId, status);
    if (!success) throw Errors.database("Failed to update product status");

    await auditRepository.log({
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
    return categoryRepository.findAll();
  }

  async getCategoryProductsCount(categoryId: string) {
    const prods = await productRepository.findAll({ categoryId });
    return { categoryId, activeProductsCount: prods.length };
  }

  async createCategory(
    adminUserId: string,
    payload: {
      name: string;
      slug: string;
      description?: string;
      display_order?: number;
      image_url?: string;
      banner_url?: string;
      asset_id?: string;
      banner_asset_id?: string;
    },
  ) {
    const existing = await categoryRepository.findBySlug(payload.slug);
    if (existing)
      throw Errors.validation("A category with this slug already exists");

    const category = await categoryRepository.createCategory(payload);
    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "CATEGORY_CREATED",
      resource_type: "category",
      resource_id: category.id,
      metadata: { name: category.name, slug: category.slug },
    });

    return category;
  }

  async updateCategory(adminUserId: string, categoryId: string, updates: any) {
    const existing = await categoryRepository.findById(categoryId);
    if (!existing) throw Errors.notFound("Category");

    const category = await categoryRepository.updateCategory(
      categoryId,
      updates,
    );
    const action =
      updates.is_active === false ? "CATEGORY_DISABLED" : "CATEGORY_UPDATED";

    await auditRepository.log({
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
  async getOrders(
    _adminUserId: string,
    filters?: {
      status?: string;
      search?: string;
      limit?: number;
      page?: number;
      offset?: number;
    },
  ) {
    return orderRepository.findAllMasterOrders(filters);
  }

  async getOrderById(_adminUserId: string, id: string) {
    const order = await orderRepository.findById(id);
    if (!order) throw Errors.notFound("Master order");
    return order;
  }

  // ── Audit Logs ────────────────────────────────────────────────────────────
  async getAuditLogs(filters?: {
    actorId?: string;
    role?: string;
    action?: string;
    search?: string;
    before?: string;
    page?: number;
    limit?: number;
    includeMetadata?: boolean;
  }) {
    return auditRepository.findAll(filters);
  }

  async getAuditLogById(id: string) {
    const log = await auditRepository.findById(id);
    if (!log) throw Errors.notFound("Audit log");
    return log;
  }

  async getAnalytics(filters?: { range?: string }) {
    const orders = await orderRepository.findAllMasterOrders();
    const range = filters?.range || "30d";

    const now = new Date();
    const startDate = new Date();
    if (range === "7d") startDate.setDate(now.getDate() - 7);
    else if (range === "90d") startDate.setDate(now.getDate() - 90);
    else if (range === "12m") startDate.setFullYear(now.getFullYear() - 1);
    else startDate.setDate(now.getDate() - 30); // default 30d

    const filtered = orders.filter(
      (o: any) => new Date(o.created_at) >= startDate,
    );

    const groups: Record<
      string,
      { gmv: number; orders: number; revenue: number }
    > = {};
    const { settingsRepository } =
      await import("../database/repositories/settings.repository.js");
    const commissionRate = await settingsRepository.getCommissionRate();

    if (range === "12m") {
      filtered.forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = d.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        if (!groups[key]) groups[key] = { gmv: 0, orders: 0, revenue: 0 };
        const gmv = o.total_paise || o.subtotal_paise || 0;
        groups[key].gmv += gmv;
        groups[key].orders += 1;
        groups[key].revenue += Math.round(gmv * (commissionRate / 100));
      });
    } else {
      filtered.forEach((o: any) => {
        const d = new Date(o.created_at);
        const key = d.toLocaleString("default", {
          day: "numeric",
          month: "short",
        });
        if (!groups[key]) groups[key] = { gmv: 0, orders: 0, revenue: 0 };
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

  async updateUser(adminUserId: string, userId: string, updates: any) {
    const user = await userRepository.updateProfile(userId, updates);
    if (!user) throw Errors.notFound("User");

    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "USER_PROFILE_UPDATED",
      resource_type: "user",
      resource_id: userId,
      metadata: updates,
    });
    return user;
  }

  async updateSeller(adminUserId: string, sellerId: string, updates: any) {
    const seller = await sellerRepository.updateProfile(sellerId, updates);
    if (!seller) throw Errors.notFound("Seller");

    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "SELLER_PROFILE_UPDATED",
      resource_type: "seller",
      resource_id: sellerId,
      metadata: updates,
    });
    return seller;
  }

  async updateProduct(adminUserId: string, productId: string, updates: any) {
    const existing = await productRepository.findById(productId);
    if (!existing) throw Errors.notFound("Product");

    const db = getAdminDb();
    const now = new Date().toISOString();

    const prodPayload: Record<string, any> = { updated_at: now };
    if (updates.name !== undefined) prodPayload.name = updates.name.trim();
    if (updates.category_id !== undefined)
      prodPayload.category_id = updates.category_id;
    if (updates.description !== undefined)
      prodPayload.description = updates.description?.trim() || null;
    if (updates.status !== undefined) prodPayload.status = updates.status;

    const { data: updatedProd, error: prodErr } = await db
      .from("products")
      .update(prodPayload)
      .eq("id", productId)
      .select()
      .maybeSingle();

    if (prodErr) throw prodErr;

    // Update Inventory
    if (
      updates.price_paise !== undefined ||
      updates.stock_quantity !== undefined ||
      updates.sku !== undefined
    ) {
      const invPayload: Record<string, any> = { updated_at: now };
      if (updates.price_paise !== undefined)
        invPayload.price_paise = Math.max(0, updates.price_paise);
      if (updates.stock_quantity !== undefined)
        invPayload.stock_quantity = Math.max(0, updates.stock_quantity);
      if (updates.sku !== undefined)
        invPayload.sku = updates.sku?.trim() || null;

      await db.from("inventory").update(invPayload).eq("product_id", productId);
    }

    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "PRODUCT_CATALOG_UPDATED",
      resource_type: "product",
      resource_id: productId,
      metadata: updates,
    });

    return productRepository.findById(productId);
  }

  async updateOrder(adminUserId: string, orderId: string, updates: any) {
    const existing = await orderRepository.findById(orderId);
    if (!existing) throw Errors.notFound("Order");

    if (updates.status !== undefined) {
      await orderRepository.updateOrderStatus(orderId, updates.status);
    }

    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "ORDER_STATUS_OVERRIDDEN",
      resource_type: "order",
      resource_id: orderId,
      metadata: updates,
    });

    return orderRepository.findById(orderId);
  }
}

export const adminService = new AdminService();
