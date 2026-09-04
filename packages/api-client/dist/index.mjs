// src/index.ts
function buildQueryString(params) {
  if (!params) return "";
  const cleanEntries = Object.entries(params).filter(
    ([_, v]) => v !== void 0 && v !== ""
  );
  if (cleanEntries.length === 0) return "";
  return `?${new URLSearchParams(cleanEntries.map(([k, v]) => [k, String(v)])).toString()}`;
}
var FloriaApiClient = class {
  baseUrl;
  getAccessToken;
  customFetch;
  pendingGetRequests = /* @__PURE__ */ new Map();
  staticCache = /* @__PURE__ */ new Map();
  constructor(config) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.getAccessToken = config.getAccessToken;
    const fn = config.fetch || (typeof window !== "undefined" ? window.fetch : globalThis.fetch);
    this.customFetch = typeof window !== "undefined" ? fn.bind(window) : fn.bind(globalThis);
  }
  async request(endpoint, options = {}) {
    const isGet = !options.method || options.method.toUpperCase() === "GET";
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    if (isGet && endpoint.includes("/catalog/categories")) {
      const cached = this.staticCache.get(url);
      if (cached && Date.now() - cached.timestamp < 6e4) {
        return cached.data;
      }
    }
    let token = null;
    if (this.getAccessToken) {
      try {
        token = await this.getAccessToken();
      } catch {
      }
    }
    const dedupeKey = isGet ? `${url}::${token || "anon"}` : "";
    if (isGet && dedupeKey) {
      const existing = this.pendingGetRequests.get(dedupeKey);
      if (existing) {
        return existing;
      }
    }
    const executeRequest = async () => {
      const headers = {
        "Content-Type": "application/json",
        ...options.headers
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 3e4) : null;
      try {
        const fetchFn = this.customFetch || (typeof window !== "undefined" ? window.fetch.bind(window) : globalThis.fetch.bind(globalThis));
        const response = await fetchFn(url, {
          ...options,
          headers,
          signal: controller?.signal || options.signal
        });
        if (timeoutId) clearTimeout(timeoutId);
        const json = await response.json();
        const apiRes = json;
        if (isGet && endpoint.includes("/catalog/categories") && apiRes.success) {
          this.staticCache.set(url, { timestamp: Date.now(), data: apiRes });
        }
        return apiRes;
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        const isAbort = error?.name === "AbortError";
        return {
          success: false,
          error: {
            code: isAbort ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
            message: isAbort ? "Request timed out waiting for server response." : error instanceof Error ? error.message : "Network request failed"
          }
        };
      } finally {
        if (isGet && dedupeKey) {
          this.pendingGetRequests.delete(dedupeKey);
        }
      }
    };
    if (isGet && dedupeKey) {
      const promise = executeRequest();
      this.pendingGetRequests.set(dedupeKey, promise);
      return promise;
    }
    return executeRequest();
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
    return this.request(
      `/api/v1/catalog/products${buildQueryString(params)}`,
      options
    );
  }
  async getProductBySlug(slug, options = {}) {
    return this.request(`/api/v1/catalog/products/${slug}`, options);
  }
  async getCategories(options = {}) {
    return this.request("/api/v1/catalog/categories", options);
  }
  async getNurseries(options = {}) {
    return this.request("/api/v1/catalog/sellers", options);
  }
  async getNurseryById(id, options = {}) {
    return this.request(`/api/v1/catalog/sellers/${id}`, options);
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
    return this.request(
      `/api/v1/customer/users/addresses/${addressId}/default`,
      {
        method: "PATCH"
      }
    );
  }
  async deleteAddress(addressId) {
    return this.request(
      `/api/v1/customer/users/addresses/${addressId}`,
      {
        method: "DELETE"
      }
    );
  }
  // Customer Checkout & Orders
  async createCheckout(data) {
    return this.request("/api/v1/customer/checkout", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  // Cashfree Payment Session & Verification
  async createPaymentSession(orderId) {
    return this.request("/api/v1/payments/create-session", {
      method: "POST",
      body: JSON.stringify({ orderId })
    });
  }
  async getOrderByCfOrderId(cfOrderId) {
    return this.request(
      `/api/v1/payments/lookup-order?cf_order_id=${encodeURIComponent(cfOrderId)}`
    );
  }
  async getPaymentStatus(paymentId) {
    return this.request(`/api/v1/payments/${paymentId}/status`);
  }
  async requestRefund(paymentId, amountPaise, reason) {
    return this.request(`/api/v1/payments/${paymentId}/refund`, {
      method: "POST",
      body: JSON.stringify({ amountPaise, reason })
    });
  }
  async getAdminTransactions(params) {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", String(params.limit));
    const qStr = query.toString();
    return this.request(
      `/api/v1/payments/admin/all${qStr ? `?${qStr}` : ""}`
    );
  }
  // Admin Media & Images Management
  async getAdminMedia(params) {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qStr = query.toString();
    return this.request(`/api/v1/admin/media${qStr ? `?${qStr}` : ""}`);
  }
  async updateAdminMedia(id, data) {
    return this.request(`/api/v1/admin/media/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
  }
  async deleteAdminMedia(id) {
    return this.request(`/api/v1/admin/media/${id}`, {
      method: "DELETE"
    });
  }
  async uploadAdminMedia(data) {
    return this.request("/api/v1/admin/media/upload", {
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
  // Seller API (/api/v1/seller & /api/v1/auth/seller)
  async loginSeller(identifier, password) {
    return this.request("/api/v1/auth/seller/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password })
    });
  }
  async requestSellerPasswordReset(identifier) {
    return this.request(
      "/api/v1/auth/seller/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ identifier })
      }
    );
  }
  async confirmSellerPasswordReset(token, password) {
    return this.request(
      "/api/v1/auth/seller/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ token, password })
      }
    );
  }
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
  async getSellerApplicationStatus(sellerId) {
    const qStr = sellerId ? `?sellerId=${encodeURIComponent(sellerId)}` : "";
    return this.request(`/api/v1/seller/application/status${qStr}`);
  }
  async resubmitSellerApplication(data) {
    return this.request("/api/v1/seller/application/resubmit", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async getSellerProducts(params) {
    return this.request(
      `/api/v1/seller/products${buildQueryString(params)}`
    );
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
  async restoreSellerProduct(id) {
    return this.request(`/api/v1/seller/products/${id}/restore`, {
      method: "POST"
    });
  }
  async permanentlyDeleteSellerProduct(id) {
    return this.request(`/api/v1/seller/products/${id}/permanent`, {
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
    return this.request(
      `/api/v1/media/upload-session/${sessionId}/complete`,
      {
        method: "POST"
      }
    );
  }
  async getMediaUploadSessionStatus(sessionId) {
    return this.request(`/api/v1/media/upload-session/${sessionId}`);
  }
  async uploadMediaDirect(params) {
    return this.request("/api/v1/media/upload-direct", {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  async attachProductImage(productId, params) {
    return this.request(`/api/v1/seller/products/${productId}/images`, {
      method: "POST",
      body: JSON.stringify(params)
    });
  }
  async removeProductImage(productId, imageId) {
    return this.request(
      `/api/v1/seller/products/${productId}/images/${imageId}`,
      {
        method: "DELETE"
      }
    );
  }
  async reorderProductImages(productId, imageOrders) {
    return this.request(
      `/api/v1/seller/products/${productId}/images/reorder`,
      {
        method: "PATCH",
        body: JSON.stringify({ imageOrders })
      }
    );
  }
  async setPrimaryProductImage(productId, imageId) {
    return this.request(
      `/api/v1/seller/products/${productId}/images/${imageId}/primary`,
      {
        method: "PATCH"
      }
    );
  }
  async replaceProductImage(productId, imageId, params) {
    return this.request(
      `/api/v1/seller/products/${productId}/images/${imageId}`,
      {
        method: "PUT",
        body: JSON.stringify(params)
      }
    );
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
    return this.request(
      `/api/v1/media/seller-documents/${documentId}/download`
    );
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
    return this.request(
      `/api/v1/seller/orders${buildQueryString(params)}`
    );
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
    return this.request(
      `/api/v1/seller/analytics${buildQueryString(params)}`
    );
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
    return this.request(
      "/api/v1/seller/settings/notifications"
    );
  }
  async updateSellerNotificationSettings(settings) {
    return this.request(
      "/api/v1/seller/settings/notifications",
      {
        method: "PATCH",
        body: JSON.stringify(settings)
      }
    );
  }
  // ── Notifications API (/api/v1/notifications) ─────────────────────────────
  async getNotifications(params) {
    return this.request(
      `/api/v1/notifications${buildQueryString(params)}`
    );
  }
  async getUnreadNotificationCount() {
    return this.request(
      "/api/v1/notifications/unread-count"
    );
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
  async deleteNotification(id) {
    return this.request(`/api/v1/notifications/${id}`, {
      method: "DELETE"
    });
  }
  getRealtimeStreamUrl() {
    return `${this.baseUrl}/api/v1/notifications/stream`;
  }
  // ── Admin API (/api/v1/admin) ─────────────────────────────────────────────
  async getAdminHealth() {
    return this.request("/api/v1/admin/health");
  }
  async getAdminDashboard() {
    return this.request("/api/v1/admin/dashboard");
  }
  async getAdminAnalytics(params) {
    return this.request(
      `/api/v1/admin/analytics${buildQueryString(params)}`
    );
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
    return this.request(
      `/api/v1/admin/users${buildQueryString(params)}`
    );
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
    return this.request(
      `/api/v1/admin/sellers${buildQueryString(params)}`
    );
  }
  async getAdminSellerApplications(status) {
    const qStr = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request(`/api/v1/admin/seller-applications${qStr}`);
  }
  async getAdminSellerById(id) {
    return this.request(`/api/v1/admin/sellers/${id}`);
  }
  async approveSeller(id) {
    return this.request(`/api/v1/admin/sellers/${id}/approve`, {
      method: "POST"
    });
  }
  async rejectSeller(id, reason) {
    return this.request(`/api/v1/admin/sellers/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
  }
  async requestSellerCorrection(id, reason) {
    return this.request(`/api/v1/admin/sellers/${id}/request-correction`, {
      method: "POST",
      body: JSON.stringify({ reason })
    });
  }
  async suspendSeller(id, reason) {
    return this.request(`/api/v1/admin/sellers/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason })
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
    return this.request(
      `/api/v1/admin/products${buildQueryString(params)}`
    );
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
    return this.request(`/api/v1/admin/products/${id}/publish`, {
      method: "PATCH"
    });
  }
  async unpublishProduct(id) {
    return this.request(`/api/v1/admin/products/${id}/unpublish`, {
      method: "PATCH"
    });
  }
  async archiveProduct(id) {
    return this.request(`/api/v1/admin/products/${id}/archive`, {
      method: "PATCH"
    });
  }
  async getAdminCategories() {
    return this.request("/api/v1/admin/categories");
  }
  async getCategoryProductsCount(id) {
    return this.request(
      `/api/v1/admin/categories/${id}/products-count`
    );
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
    return this.request(
      `/api/v1/admin/orders${buildQueryString(params)}`
    );
  }
  async getAdminOrderById(id) {
    return this.request(`/api/v1/admin/orders/${id}`);
  }
  async getAuditLogs(params) {
    return this.request(
      `/api/v1/admin/audit-logs${buildQueryString(params)}`
    );
  }
  async getAuditLogById(id) {
    return this.request(`/api/v1/admin/audit-logs/${id}`);
  }
  async getPlatformSettings() {
    return this.request(
      "/api/v1/admin/settings/platform"
    );
  }
  async updateCommissionRate(commissionRate) {
    return this.request(
      "/api/v1/admin/settings/commission",
      {
        method: "PATCH",
        body: JSON.stringify({ commissionRate })
      }
    );
  }
  // ── Operations API (/api/v1/operations) ──────────────────────────────────
  async getOperationsHealth() {
    return this.request("/api/v1/operations/health");
  }
  async getOperationsDashboard() {
    return this.request("/api/v1/operations/dashboard");
  }
  async getOperationsOrders(params) {
    return this.request(
      `/api/v1/operations/orders${buildQueryString(params)}`
    );
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
    return this.request(
      `/api/v1/operations/pickups${buildQueryString(params)}`
    );
  }
  async updatePickupStatus(id, status, notes) {
    return this.request(`/api/v1/operations/pickups/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, notes })
    });
  }
  async getPackingTasks(params) {
    return this.request(
      `/api/v1/operations/packing${buildQueryString(params)}`
    );
  }
  async updatePackingTask(id, status, verifiedItemsCount) {
    return this.request(`/api/v1/operations/packing/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, verifiedItemsCount })
    });
  }
  async getDeliveries(params) {
    return this.request(
      `/api/v1/operations/deliveries${buildQueryString(params)}`
    );
  }
  async getDeliveryById(id) {
    return this.request(
      `/api/v1/operations/deliveries/${id}`
    );
  }
  async assignDelivery(id, data) {
    return this.request(
      `/api/v1/operations/deliveries/${id}/assign`,
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  }
  async reassignDelivery(id, data) {
    return this.request(
      `/api/v1/operations/deliveries/${id}/reassign`,
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  }
  async updateDeliveryStatus(id, status) {
    return this.request(
      `/api/v1/operations/deliveries/${id}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status })
      }
    );
  }
  async completeDeliveryWithPod(id, data) {
    return this.request(
      `/api/v1/operations/deliveries/${id}/complete`,
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  }
  async getDeliveryPod(id) {
    return this.request(
      `/api/v1/operations/deliveries/${id}/pod`
    );
  }
  // ------------------------------------------------------------------
  // Delivery Partner Ecosystem APIs (Phase 6)
  // ------------------------------------------------------------------
  async submitDeliveryApplication(data) {
    return this.request(
      `/api/v1/delivery-partners/applications`,
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  }
  async getDeliveryApplicationStatus(idOrEmail) {
    const isEmail = idOrEmail.includes("@");
    const path = isEmail ? `/api/v1/delivery-partners/applications/status?email=${encodeURIComponent(idOrEmail)}` : `/api/v1/delivery-partners/applications/${encodeURIComponent(idOrEmail)}/status`;
    return this.request(path);
  }
  async activateDeliveryPartner(data) {
    return this.request(
      `/api/v1/delivery-partners/auth/activate`,
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  }
  async loginDeliveryPartner(identifier, password) {
    return this.request(`/api/v1/delivery-partners/auth/login`, {
      method: "POST",
      body: JSON.stringify({ identifier, password })
    });
  }
  async requestDeliveryPartnerPasswordReset(email) {
    return this.request(
      `/api/v1/delivery-partners/auth/forgot-password`,
      {
        method: "POST",
        body: JSON.stringify({ email })
      }
    );
  }
  async resetDeliveryPartnerPassword(data) {
    return this.request(
      `/api/v1/delivery-partners/auth/reset-password`,
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  }
  async getDeliveryPartnerProfile() {
    return this.request(
      `/api/v1/delivery-partners/me`
    );
  }
  async updateDeliveryPartnerAvailability(onDuty) {
    return this.request(
      `/api/v1/delivery-partners/me/availability`,
      {
        method: "POST",
        body: JSON.stringify({ onDuty })
      }
    );
  }
  async getDeliveryPartnerDeliveries(params) {
    return this.request(
      `/api/v1/delivery-partners/my-deliveries${buildQueryString(params)}`
    );
  }
  async getDeliveryPartnerEarnings(params) {
    return this.request(`/api/v1/delivery-partners/my-earnings${buildQueryString(params)}`);
  }
  async getAdminDeliveryApplications(params) {
    return this.request(
      `/api/v1/delivery-partners/admin/applications${buildQueryString(params)}`
    );
  }
  async getAdminDeliveryApplicationById(id) {
    return this.request(
      `/api/v1/delivery-partners/admin/applications/${id}`
    );
  }
  async approveDeliveryApplication(id) {
    return this.request(`/api/v1/delivery-partners/admin/applications/${id}/approve`, {
      method: "POST"
    });
  }
  async rejectDeliveryApplication(id, reason) {
    return this.request(
      `/api/v1/delivery-partners/admin/applications/${id}/reject`,
      {
        method: "POST",
        body: JSON.stringify({ reason })
      }
    );
  }
  async getAdminDeliveryPartners(params) {
    return this.request(
      `/api/v1/delivery-partners/admin/partners${buildQueryString(params)}`
    );
  }
  async updateAdminDeliveryPartnerStatus(id, status) {
    return this.request(
      `/api/v1/delivery-partners/admin/partners/${id}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status })
      }
    );
  }
  async getAdminDeliveryPayouts(params) {
    return this.request(
      `/api/v1/delivery-partners/admin/payouts${buildQueryString(params)}`
    );
  }
  // ── Media Upload Sessions (/api/v1/media) ──────────────────────────────────
  async createUploadSession(data) {
    return this.request("/api/v1/media/upload-session", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
  async completeUploadSession(sessionId) {
    return this.request(`/api/v1/media/upload-session/${sessionId}/complete`, {
      method: "POST"
    });
  }
  // ── REVIEWS & RATINGS ─────────────────────────────────────────────────────
  async getProductReviews(productId, params) {
    return this.request(
      `/api/v1/catalog/products/${productId}/reviews${buildQueryString(params)}`
    );
  }
  async getReviewEligibility(productId) {
    return this.request(`/api/v1/catalog/products/${productId}/review-eligibility`);
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
    return this.request(
      `/api/v1/catalog/products/${productId}/reviews/${reviewId}/helpful`,
      {
        method: "POST"
      }
    );
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
    return this.request(`/api/v1/seller/reviews/${reviewId}/flag`, {
      method: "PATCH"
    });
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
    return this.request(
      `/api/v1/catalog/products/${slug}/related`,
      options
    );
  }
  async getRankedNurseries(options = {}) {
    return this.request(`/api/v1/catalog/sellers`, options);
  }
  // ── ADMIN FINANCIAL TRANSPARENCY ─────────────────────────────────────────
  async getAdminProductFinancialCalculation(productId) {
    return this.request(`/api/v1/admin/products/${productId}/financial-calculation`);
  }
  async getAdminOrderFinancialBreakdown(orderId) {
    return this.request(
      `/api/v1/admin/orders/${orderId}/financial-breakdown`
    );
  }
  // ── DELIVERY FEE ENGINE & POLICY ─────────────────────────────────────────
  async getDeliverySettings() {
    return this.request(
      "/api/v1/delivery/settings"
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
      "/api/v1/pricing/settings"
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
    return this.request("/api/v1/admin/pricing-policies");
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
  // ── P1 Delivery Device Tokens ─────────────────────────────────────────────
  async registerDeliveryDeviceToken(data) {
    return this.request(
      "/api/v1/delivery-partners/device-token",
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  }
  async removeDeliveryDeviceToken(token) {
    return this.request(
      "/api/v1/delivery-partners/device-token",
      {
        method: "DELETE",
        body: JSON.stringify({ token })
      }
    );
  }
  // ── P1 Delivery Rate Cards ────────────────────────────────────────────────
  async getActiveDeliveryRateCard() {
    return this.request(
      "/api/v1/delivery-partners/rate-cards/active"
    );
  }
  async listDeliveryRateCards() {
    return this.request(
      "/api/v1/delivery-partners/admin/rate-cards"
    );
  }
  async createDeliveryRateCard(data) {
    return this.request(
      "/api/v1/delivery-partners/admin/rate-cards",
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    );
  }
  async updateDeliveryRateCard(id, data) {
    return this.request(
      `/api/v1/delivery-partners/admin/rate-cards/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data)
      }
    );
  }
};
export {
  FloriaApiClient
};
