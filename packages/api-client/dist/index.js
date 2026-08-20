"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  FloriaApiClient: () => FloriaApiClient
});
module.exports = __toCommonJS(index_exports);
function buildQueryString(params) {
  if (!params) return "";
  const cleanEntries = Object.entries(params).filter(([_, v]) => v !== void 0 && v !== "");
  if (cleanEntries.length === 0) return "";
  return `?${new URLSearchParams(cleanEntries.map(([k, v]) => [k, String(v)])).toString()}`;
}
var FloriaApiClient = class {
  baseUrl;
  getAccessToken;
  customFetch;
  constructor(config) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.getAccessToken = config.getAccessToken;
    const fn = config.fetch || (typeof window !== "undefined" ? window.fetch : globalThis.fetch);
    this.customFetch = typeof window !== "undefined" ? fn.bind(window) : fn.bind(globalThis);
  }
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers
    };
    if (this.getAccessToken) {
      const token = await this.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    try {
      const fetchFn = this.customFetch || (typeof window !== "undefined" ? window.fetch.bind(window) : globalThis.fetch.bind(globalThis));
      const response = await fetchFn(url, {
        ...options,
        headers
      });
      const json = await response.json();
      return json;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network request failed"
        }
      };
    }
  }
  // Health check
  async getHealth() {
    return this.request("/health");
  }
  async getReadiness() {
    return this.request("/ready");
  }
  // Public Catalog API (/api/v1/catalog)
  async getProducts(params, options = {}) {
    return this.request(`/api/v1/catalog/products${buildQueryString(params)}`, options);
  }
  async getProductBySlug(slug, options = {}) {
    return this.request(`/api/v1/catalog/products/${slug}`, options);
  }
  async getCategories(options = {}) {
    return this.request("/api/v1/catalog/categories", options);
  }
  // Customer Cart API (/api/v1/customer/cart)
  async getCart() {
    return this.request("/api/v1/customer/cart");
  }
  async addToCart(productId, quantity) {
    return this.request("/api/v1/customer/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity })
    });
  }
  async updateCartQuantity(productId, quantity) {
    return this.request(`/api/v1/customer/cart/items/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity })
    });
  }
  async removeFromCart(productId) {
    return this.request(`/api/v1/customer/cart/items/${productId}`, {
      method: "DELETE"
    });
  }
  async clearCart() {
    return this.request("/api/v1/customer/cart", {
      method: "DELETE"
    });
  }
  async mergeCart(items) {
    return this.request("/api/v1/customer/cart/merge", {
      method: "POST",
      body: JSON.stringify({ items })
    });
  }
  // Customer Wishlist API (/api/v1/customer/wishlist)
  async getWishlist() {
    return this.request("/api/v1/customer/wishlist");
  }
  async addToWishlist(productId) {
    return this.request("/api/v1/customer/wishlist/items", {
      method: "POST",
      body: JSON.stringify({ productId })
    });
  }
  async removeFromWishlist(productId) {
    return this.request(`/api/v1/customer/wishlist/items/${productId}`, {
      method: "DELETE"
    });
  }
  async mergeWishlist(productIds) {
    return this.request("/api/v1/customer/wishlist/merge", {
      method: "POST",
      body: JSON.stringify({ productIds })
    });
  }
  // Customer Profile & Addresses (/api/v1/customer/users)
  async getProfile() {
    return this.request("/api/v1/customer/users/me");
  }
  async updateProfile(data) {
    return this.request("/api/v1/customer/users/me", {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  }
  async deleteAccount() {
    return this.request("/api/v1/customer/users/me", {
      method: "DELETE"
    });
  }
  async getAddresses() {
    return this.request("/api/v1/customer/users/addresses");
  }
  async createAddress(addressData) {
    return this.request("/api/v1/customer/users/addresses", {
      method: "POST",
      body: JSON.stringify(addressData)
    });
  }
  async updateAddress(addressId, addressData) {
    return this.request(`/api/v1/customer/users/addresses/${addressId}`, {
      method: "PATCH",
      body: JSON.stringify(addressData)
    });
  }
  async setDefaultAddress(addressId) {
    return this.request(`/api/v1/customer/users/addresses/${addressId}/default`, {
      method: "PATCH"
    });
  }
  async deleteAddress(addressId) {
    return this.request(`/api/v1/customer/users/addresses/${addressId}`, {
      method: "DELETE"
    });
  }
  // Customer Checkout & Orders
  async createCheckout(data) {
    return this.request("/api/v1/customer/checkout", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async getOrders() {
    return this.request("/api/v1/customer/orders");
  }
  async getOrderById(id) {
    return this.request(`/api/v1/customer/orders/${id}`);
  }
  // Seller API (/api/v1/seller)
  async getSellerProfile() {
    return this.request("/api/v1/seller/profile");
  }
  async updateSellerProfile(data) {
    return this.request("/api/v1/seller/profile", {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  }
  async submitSellerApplication(data) {
    return this.request("/api/v1/seller/applications", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async getSellerApplication() {
    return this.request("/api/v1/seller/applications");
  }
  async getSellerProducts(params) {
    return this.request(`/api/v1/seller/products${buildQueryString(params)}`);
  }
  async getSellerProductById(id) {
    return this.request(`/api/v1/seller/products/${id}`);
  }
  async createSellerProduct(data) {
    return this.request("/api/v1/seller/products", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async updateSellerProduct(id, data) {
    return this.request(`/api/v1/seller/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  }
  async deleteSellerProduct(id) {
    return this.request(`/api/v1/seller/products/${id}`, {
      method: "DELETE"
    });
  }
  async updateSellerProductStatus(id, status) {
    return this.request(`/api/v1/seller/products/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  }
  // ── SELLER PRODUCT MEDIA INTEGRATION (STAGE 8) ───────────────────────────
  async createMediaUploadSession(params) {
    return this.request("/api/v1/media/upload-session", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  async completeMediaUploadSession(sessionId) {
    return this.request(`/api/v1/media/upload-session/${sessionId}/complete`, {
      method: "POST"
    });
  }
  async getMediaUploadSessionStatus(sessionId) {
    return this.request(`/api/v1/media/upload-session/${sessionId}`);
  }
  async attachProductImage(productId, params) {
    return this.request(`/api/v1/seller/products/${productId}/images`, {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  async removeProductImage(productId, imageId) {
    return this.request(`/api/v1/seller/products/${productId}/images/${imageId}`, {
      method: "DELETE"
    });
  }
  async reorderProductImages(productId, imageOrders) {
    return this.request(`/api/v1/seller/products/${productId}/images/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ imageOrders })
    });
  }
  async setPrimaryProductImage(productId, imageId) {
    return this.request(`/api/v1/seller/products/${productId}/images/${imageId}/primary`, {
      method: "PATCH"
    });
  }
  async replaceProductImage(productId, imageId, params) {
    return this.request(`/api/v1/seller/products/${productId}/images/${imageId}`, {
      method: "PUT",
      body: JSON.stringify(params)
    });
  }
  // ── STAGE 9 REMAINING MEDIA DOMAIN INTEGRATIONS ─────────────────────────
  async updateSellerLogo(assetId) {
    return this.request("/api/v1/media/seller-logo", {
      method: "PATCH",
      body: JSON.stringify({ assetId })
    });
  }
  async updateUserAvatar(assetId) {
    return this.request("/api/v1/media/user-avatar", {
      method: "PATCH",
      body: JSON.stringify({ assetId })
    });
  }
  async updateCategoryBanner(categoryId, assetId) {
    return this.request(`/api/v1/media/category-banner/${categoryId}`, {
      method: "PATCH",
      body: JSON.stringify({ assetId })
    });
  }
  async attachReviewImage(reviewId, assetId, displayOrder = 0) {
    return this.request(`/api/v1/media/reviews/${reviewId}/images`, {
      method: "POST",
      body: JSON.stringify({ assetId, displayOrder })
    });
  }
  async attachSellerDocument(documentType, fileAssetId) {
    return this.request("/api/v1/media/seller-documents", {
      method: "POST",
      body: JSON.stringify({ documentType, fileAssetId })
    });
  }
  async getSignedDocumentUrl(documentId) {
    return this.request(`/api/v1/media/seller-documents/${documentId}/download`);
  }
  async updateNurseryBanner(assetId) {
    return this.request("/api/v1/media/nursery-banner", {
      method: "PATCH",
      body: JSON.stringify({ assetId })
    });
  }
  async getSellerInventory() {
    return this.request("/api/v1/seller/inventory");
  }
  async updateSellerInventory(productId, data) {
    return this.request(`/api/v1/seller/inventory/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  }
  async getSellerOrders(params) {
    return this.request(`/api/v1/seller/orders${buildQueryString(params)}`);
  }
  async getSellerOrderById(id) {
    return this.request(`/api/v1/seller/orders/${id}`);
  }
  async updateFulfillmentStatus(masterOrderId, newStatus) {
    return this.request("/api/v1/seller/fulfillment", {
      method: "POST",
      body: JSON.stringify({ masterOrderId, newStatus })
    });
  }
  async getSellerDashboard() {
    return this.request("/api/v1/seller/dashboard");
  }
  async getSellerEarnings() {
    return this.request("/api/v1/seller/earnings");
  }
  async getSellerPayouts() {
    return this.request("/api/v1/seller/payouts");
  }
  async getSellerAnalytics(params) {
    return this.request(`/api/v1/seller/analytics${buildQueryString(params)}`);
  }
  async getSellerDocuments() {
    return this.request("/api/v1/seller/documents");
  }
  async uploadSellerDocument(data) {
    return this.request("/api/v1/seller/documents", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async getSellerNotificationSettings() {
    return this.request("/api/v1/seller/settings/notifications");
  }
  async updateSellerNotificationSettings(settings) {
    return this.request("/api/v1/seller/settings/notifications", {
      method: "PATCH",
      body: JSON.stringify(settings)
    });
  }
  // ── Notifications API (/api/v1/notifications) ─────────────────────────────
  async getNotifications(params) {
    return this.request(`/api/v1/notifications${buildQueryString(params)}`);
  }
  async getUnreadNotificationCount() {
    return this.request("/api/v1/notifications/unread-count");
  }
  async markNotificationRead(id) {
    return this.request(`/api/v1/notifications/${id}/read`, {
      method: "PATCH"
    });
  }
  async markAllNotificationsRead() {
    return this.request("/api/v1/notifications/read-all", {
      method: "PATCH"
    });
  }
  // ── Admin API (/api/v1/admin) ─────────────────────────────────────────────
  async getAdminHealth() {
    return this.request("/api/v1/admin/health");
  }
  async getAdminDashboard() {
    return this.request("/api/v1/admin/dashboard");
  }
  async getAdminAnalytics(params) {
    return this.request(`/api/v1/admin/analytics${buildQueryString(params)}`);
  }
  async updateAdminUser(id, payload) {
    return this.request(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }
  async updateAdminSeller(id, payload) {
    return this.request(`/api/v1/admin/sellers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }
  async updateAdminProduct(id, payload) {
    return this.request(`/api/v1/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }
  async updateAdminOrder(id, payload) {
    return this.request(`/api/v1/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }
  async getAdminUsers(params) {
    return this.request(`/api/v1/admin/users${buildQueryString(params)}`);
  }
  async getAdminUserById(id) {
    return this.request(`/api/v1/admin/users/${id}`);
  }
  async updateAdminUserStatus(id, status, rationale) {
    return this.request(`/api/v1/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rationale })
    });
  }
  async getAdminSellers(params) {
    return this.request(`/api/v1/admin/sellers${buildQueryString(params)}`);
  }
  async getAdminSellerById(id) {
    return this.request(`/api/v1/admin/sellers/${id}`);
  }
  async approveSeller(id) {
    return this.request(`/api/v1/admin/sellers/${id}/approve`, {
      method: "POST"
    });
  }
  async rejectSeller(id) {
    return this.request(`/api/v1/admin/sellers/${id}/reject`, {
      method: "POST"
    });
  }
  async suspendSeller(id) {
    return this.request(`/api/v1/admin/sellers/${id}/suspend`, {
      method: "POST"
    });
  }
  async reactivateSeller(id) {
    return this.request(`/api/v1/admin/sellers/${id}/reactivate`, {
      method: "POST"
    });
  }
  async getAdminSellerDocuments(id) {
    return this.request(`/api/v1/admin/sellers/${id}/documents`);
  }
  async getAdminProducts(params) {
    return this.request(`/api/v1/admin/products${buildQueryString(params)}`);
  }
  async getAdminProductById(id) {
    return this.request(`/api/v1/admin/products/${id}`);
  }
  async updateAdminProductStatus(id, status) {
    return this.request(`/api/v1/admin/products/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
  }
  async publishProduct(id) {
    return this.request(`/api/v1/admin/products/${id}/publish`, { method: "PATCH" });
  }
  async unpublishProduct(id) {
    return this.request(`/api/v1/admin/products/${id}/unpublish`, { method: "PATCH" });
  }
  async archiveProduct(id) {
    return this.request(`/api/v1/admin/products/${id}/archive`, { method: "PATCH" });
  }
  async getAdminCategories() {
    return this.request("/api/v1/admin/categories");
  }
  async getCategoryProductsCount(id) {
    return this.request(`/api/v1/admin/categories/${id}/products-count`);
  }
  async createAdminCategory(data) {
    return this.request("/api/v1/admin/categories", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async updateAdminCategory(id, data) {
    return this.request(`/api/v1/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  }
  async getAdminOrders(params) {
    return this.request(`/api/v1/admin/orders${buildQueryString(params)}`);
  }
  async getAdminOrderById(id) {
    return this.request(`/api/v1/admin/orders/${id}`);
  }
  async getAuditLogs(params) {
    return this.request(`/api/v1/admin/audit-logs${buildQueryString(params)}`);
  }
  async getPlatformSettings() {
    return this.request("/api/v1/admin/settings/platform");
  }
  async updateCommissionRate(commissionRate) {
    return this.request("/api/v1/admin/settings/commission", {
      method: "PATCH",
      body: JSON.stringify({ commissionRate })
    });
  }
  // ── Operations API (/api/v1/operations) ──────────────────────────────────
  async getOperationsHealth() {
    return this.request("/api/v1/operations/health");
  }
  async getOperationsDashboard() {
    return this.request("/api/v1/operations/dashboard");
  }
  async getOperationsOrders(params) {
    return this.request(`/api/v1/operations/orders${buildQueryString(params)}`);
  }
  async getOperationsOrderById(id) {
    return this.request(`/api/v1/operations/orders/${id}`);
  }
  async updateOperationsOrderStatus(id, status) {
    return this.request(`/api/v1/operations/orders/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status })
    });
  }
  async getPickups(params) {
    return this.request(`/api/v1/operations/pickups${buildQueryString(params)}`);
  }
  async updatePickupStatus(id, status, notes) {
    return this.request(`/api/v1/operations/pickups/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, notes })
    });
  }
  async getPackingTasks(params) {
    return this.request(`/api/v1/operations/packing${buildQueryString(params)}`);
  }
  async updatePackingTask(id, status, verifiedItemsCount) {
    return this.request(`/api/v1/operations/packing/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, verifiedItemsCount })
    });
  }
  async getDeliveries(params) {
    return this.request(`/api/v1/operations/deliveries${buildQueryString(params)}`);
  }
  async getDeliveryById(id) {
    return this.request(`/api/v1/operations/deliveries/${id}`);
  }
  async assignDelivery(id, data) {
    return this.request(`/api/v1/operations/deliveries/${id}/assign`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async reassignDelivery(id, data) {
    return this.request(`/api/v1/operations/deliveries/${id}/reassign`, {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async updateDeliveryStatus(id, status) {
    return this.request(`/api/v1/operations/deliveries/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status })
    });
  }
  // ── REVIEWS & RATINGS ─────────────────────────────────────────────────────
  async getProductReviews(productId, params) {
    return this.request(
      `/api/v1/catalog/products/${productId}/reviews${buildQueryString(params)}`
    );
  }
  async getReviewEligibility(productId) {
    return this.request(
      `/api/v1/catalog/products/${productId}/review-eligibility`
    );
  }
  async submitReview(productId, payload) {
    return this.request(`/api/v1/catalog/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
  async updateMyReview(reviewId, payload) {
    return this.request(`/api/v1/customer/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }
  async markReviewHelpful(productId, reviewId) {
    return this.request(`/api/v1/catalog/products/${productId}/reviews/${reviewId}/helpful`, {
      method: "POST"
    });
  }
  async getMyReviews(params) {
    return this.request(
      `/api/v1/customer/reviews${buildQueryString(params)}`
    );
  }
  async getSellerReviews(params) {
    return this.request(
      `/api/v1/seller/reviews${buildQueryString(params)}`
    );
  }
  async flagReview(reviewId) {
    return this.request(`/api/v1/seller/reviews/${reviewId}/flag`, { method: "PATCH" });
  }
  async adminGetReviews(params) {
    return this.request(
      `/api/v1/admin/reviews${buildQueryString(params)}`
    );
  }
  async adminModerateReview(reviewId, action, note) {
    return this.request(`/api/v1/admin/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, note })
    });
  }
  // ── CATALOG: TRENDING, RELATED, RANKED NURSERIES ─────────────────────────
  async getTrendingProducts(params, options = {}) {
    return this.request(
      `/api/v1/catalog/products/trending${buildQueryString(params)}`,
      options
    );
  }
  async getRelatedProducts(slug, options = {}) {
    return this.request(`/api/v1/catalog/products/${slug}/related`, options);
  }
  async getRankedNurseries(options = {}) {
    return this.request(`/api/v1/catalog/sellers`, options);
  }
  // ── ADMIN FINANCIAL TRANSPARENCY ─────────────────────────────────────────
  async getAdminProductFinancialCalculation(productId) {
    return this.request(
      `/api/v1/admin/products/${productId}/financial-calculation`
    );
  }
  async getAdminOrderFinancialBreakdown(orderId) {
    return this.request(
      `/api/v1/admin/orders/${orderId}/financial-breakdown`
    );
  }
  // ── DELIVERY FEE ENGINE & POLICY ─────────────────────────────────────────
  async getDeliverySettings() {
    return this.request(
      "/api/v1/admin/settings/delivery"
    );
  }
  async updateDeliverySettings(updates) {
    return this.request(
      "/api/v1/admin/settings/delivery",
      {
        method: "PATCH",
        body: JSON.stringify(updates)
      }
    );
  }
  async previewDeliveryFee(subtotalPaise) {
    return this.request(
      "/api/v1/admin/delivery/preview",
      {
        method: "POST",
        body: JSON.stringify({ subtotalPaise })
      }
    );
  }
  // ── FINANCIAL SETTINGS & UNIFIED PRICING ENGINE ───────────────────────────
  async getFinancialSettings() {
    return this.request(
      "/api/v1/admin/settings/financials"
    );
  }
  async updateFinancialSettings(updates) {
    return this.request(
      "/api/v1/admin/settings/financials",
      {
        method: "PATCH",
        body: JSON.stringify(updates)
      }
    );
  }
  // ── VERSIONED PRICING POLICIES (PHASE 3.23) ───────────────────────────────
  async getPricingPolicies() {
    return this.request(
      "/api/v1/admin/pricing-policies"
    );
  }
  async getActivePricingPolicy() {
    return this.request(
      "/api/v1/admin/pricing-policies/active"
    );
  }
  async createPricingPolicyDraft(params) {
    return this.request(
      "/api/v1/admin/pricing-policies",
      {
        method: "POST",
        body: JSON.stringify(params)
      }
    );
  }
  async previewPricingPolicyImpact(policyId) {
    return this.request(
      `/api/v1/admin/pricing-policies/${policyId}/preview`
    );
  }
  async startPricingRecalculation(policyId) {
    return this.request(
      `/api/v1/admin/pricing-policies/${policyId}/recalculate`,
      { method: "POST" }
    );
  }
  async getPricingRecalculationStatus(policyId) {
    return this.request(
      `/api/v1/admin/pricing-policies/${policyId}/recalculation-status`
    );
  }
  async activatePricingPolicy(policyId) {
    return this.request(
      `/api/v1/admin/pricing-policies/${policyId}/activate`,
      { method: "POST" }
    );
  }
  async setPricingOverride(params) {
    return this.request(
      "/api/v1/admin/pricing-policies/overrides",
      {
        method: "POST",
        body: JSON.stringify(params)
      }
    );
  }
  async removePricingOverride(productId) {
    return this.request(
      `/api/v1/admin/pricing-policies/overrides/${productId}`,
      { method: "DELETE" }
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FloriaApiClient
});
