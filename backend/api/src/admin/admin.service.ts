// Floria API — Admin Service
import { userRepository } from "../database/repositories/user.repository.js";
import { sellerRepository } from "../database/repositories/seller.repository.js";
import { productRepository } from "../database/repositories/product.repository.js";
import { categoryRepository } from "../database/repositories/category.repository.js";
import { orderRepository } from "../database/repositories/order.repository.js";
import { auditRepository } from "../database/repositories/audit.repository.js";
import { Errors } from "../utils/errors.js";

export class AdminService {
  async getDashboard() {
    const [users, sellers, prods, orders] = await Promise.all([
      userRepository.findAll(1000),
      sellerRepository.findAll(),
      productRepository.findAll(),
      orderRepository.findAllMasterOrders(),
    ]);

    const totalCustomers = users.filter((u: any) => u.role === "customer").length;
    const totalSellers = sellers.length;
    const pendingSellerApplications = sellers.filter((s: any) => s.status === "pending").length;
    const approvedSellers = sellers.filter((s: any) => s.status === "approved").length;
    const suspendedSellers = sellers.filter((s: any) => s.status === "suspended").length;

    const totalProducts = prods.length;
    const activeProducts = prods.filter((p: any) => p.status === "active").length;
    const draftProducts = prods.filter((p: any) => p.status === "draft").length;
    const outOfStockProducts = prods.filter((p: any) => {
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

    orders.forEach((o: any) => {
      const st = (o.status || "").toLowerCase();
      if (st === "order placed" || st === "nursery confirmed") pendingOrders++;
      else if (st === "preparing") preparingOrders++;
      else if (st === "ready for pickup" || st === "picked up") readyForPickupOrders++;
      else if (st === "packing" || st === "out for delivery") outForDeliveryOrders++;
      else if (st === "delivered") deliveredOrders++;
      else if (st === "cancelled") cancelledOrders++;

      totalOrderValue += o.subtotal_paise || 0;
      (o.order_items || []).forEach((item: any) => {
        totalItemsSold += item.quantity || 1;
      });
    });

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
        totalItemsSold,
      },
    };
  }

  // ── Users Management ─────────────────────────────────────────────────────
  async getUsers() {
    return userRepository.findAll();
  }

  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw Errors.notFound("User");
    return user;
  }

  async updateUserStatus(adminUserId: string, userId: string, status: "active" | "suspended", rationale?: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw Errors.notFound("User");

    const action = status === "suspended" ? "CUSTOMER_SUSPENDED" : "CUSTOMER_REACTIVATED";
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

  async updateSellerStatus(adminUserId: string, sellerId: string, status: "approved" | "suspended" | "pending" | "rejected") {
    const seller = await sellerRepository.findById(sellerId);
    if (!seller) throw Errors.notFound("Seller profile");

    const currentStatus = seller.status;
    if (currentStatus === status) {
      return { id: sellerId, status };
    }

    if (currentStatus === "rejected" && status === "approved") {
      throw Errors.validation("Cannot directly approve a rejected seller application without resubmission");
    }

    let action = "SELLER_UPDATED";
    if (status === "approved") action = "SELLER_APPROVED";
    else if (status === "rejected") action = "SELLER_REJECTED";
    else if (status === "suspended") action = "SELLER_SUSPENDED";
    else if (status === "pending" || (currentStatus === "suspended" && status === "approved")) action = "SELLER_REACTIVATED";

    const success = await sellerRepository.updateStatus(sellerId, status as any);
    if (!success) throw Errors.database("Failed to update seller status.");

    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action,
      resource_type: "seller_profile",
      resource_id: sellerId,
      metadata: { from: currentStatus, to: status },
    });

    return { id: sellerId, status };
  }

  async getSellerDocuments(sellerId: string) {
    const seller = await sellerRepository.findById(sellerId);
    if (!seller) throw Errors.notFound("Seller profile");

    return {
      sellerId,
      documents: [
        { type: "nursery_license", url: "/documents/sample_license.pdf", status: "verified" },
        { type: "gst_certificate", url: "/documents/sample_gst.pdf", status: "verified" },
      ],
    };
  }

  // ── Product Moderation ────────────────────────────────────────────────────
  async getProducts(filters?: { search?: string; status?: string; categoryId?: string; sellerId?: string }) {
    return productRepository.findAll(filters);
  }

  async getProductById(id: string) {
    const prod = await productRepository.findById(id);
    if (!prod) throw Errors.notFound("Product");
    return prod;
  }

  async updateProductStatus(adminUserId: string, productId: string, status: string) {
    const prod = await productRepository.findById(productId);
    if (!prod) throw Errors.notFound("Product");

    let action = "PRODUCT_MODERATED";
    if (status === "active") action = "PRODUCT_PUBLISHED";
    else if (status === "inactive" || status === "draft") action = "PRODUCT_UNPUBLISHED";
    else if (status === "deleted" || status === "archived") action = "PRODUCT_ARCHIVED";

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

  async createCategory(adminUserId: string, payload: { name: string; slug: string; description?: string; display_order?: number }) {
    const existing = await categoryRepository.findBySlug(payload.slug);
    if (existing) throw Errors.validation("A category with this slug already exists");

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

    const category = await categoryRepository.updateCategory(categoryId, updates);
    const action = updates.is_active === false ? "CATEGORY_DISABLED" : "CATEGORY_UPDATED";

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
  async getOrders(adminUserId: string, filters?: { status?: string; search?: string }) {
    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "ORDER_VIEWED_BY_ADMIN",
      resource_type: "orders_list",
    });
    return orderRepository.findAllMasterOrders(filters);
  }

  async getOrderById(adminUserId: string, id: string) {
    const order = await orderRepository.findById(id);
    if (!order) throw Errors.notFound("Master order");

    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "ORDER_VIEWED_BY_ADMIN",
      resource_type: "order",
      resource_id: id,
    });

    return order;
  }

  // ── Audit Logs ────────────────────────────────────────────────────────────
  async getAuditLogs(filters?: { actorId?: string; role?: string; action?: string }) {
    const logs = await auditRepository.findAll();
    let results = logs;
    if (filters?.role) {
      results = results.filter((l: any) => l.actor_role === filters.role);
    }
    if (filters?.action) {
      results = results.filter((l: any) => l.action === filters.action);
    }
    if (filters?.actorId) {
      results = results.filter((l: any) => l.actor_user_id === filters.actorId);
    }
    return results;
  }
}

export const adminService = new AdminService();
