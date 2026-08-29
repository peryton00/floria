// Floria — Universal Typed API Client
// Consumed by Web App, Mobile App (Flutter via REST), Seller Portal, Admin Portal, Operations Portal.

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  fetch?: typeof fetch;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface SellerDashboardData {
  profile: any;
  kpis: {
    totalProducts: number;
    publishedProducts: number;
    draftProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    newOrders: number;
    preparingOrders: number;
    readyForPickupOrders: number;
    completedOrders: number;
    totalOrders: number;
    totalRevenuePaise: number;
  };
  recentOrders: any[];
  inventoryAlerts: Array<{
    id: string;
    name: string;
    slug: string;
    stockQuantity: number;
    lowStockThreshold: number;
    pricePaise: number;
    status: "low_stock" | "out_of_stock";
  }>;
  actionRequired: Array<{
    id: string;
    title: string;
    count: number;
    type: string;
    href: string;
  }>;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  role: "customer" | "seller" | "operations" | "admin";
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  source_type?: string;
  source_id?: string;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
}

export interface SellerDocument {
  id: string;
  seller_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  mime_type: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerNotificationSettings {
  seller_id: string;
  new_order_notifications: boolean;
  low_stock_notifications: boolean;
  email_notifications: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";

export interface ProductReview {
  id: string;
  product_id: string;
  customer_id?: string;
  rating: number;
  title?: string;
  body?: string;
  is_verified_purchase: boolean;
  status?: ReviewStatus;
  helpful_count: number;
  reported_count?: number;
  seller_reply?: string;
  moderation_note?: string;
  created_at: string;
  updated_at?: string;
  customer?: { full_name: string | null };
  product?: { id: string; name: string; slug: string };
  images?: Array<{
    id: string;
    url: string;
    variants?: Record<string, string>;
  }>;
}

export interface ReviewSummary {
  product_id: string;
  review_count: number;
  avg_rating: number;
  bayesian_rating: number;
  wilson_lower_bound: number;
  star_1_count: number;
  star_2_count: number;
  star_3_count: number;
  star_4_count: number;
  star_5_count: number;
}

export interface ReviewListResponse {
  reviews: ProductReview[];
  total: number;
  summary?: ReviewSummary | null;
}

export interface NurserySummary {
  id: string;
  business_name: string;
  business_description?: string;
  logo_url?: string;
  address?: string;
  rating_summary?: {
    review_count: number;
    avg_rating: number;
    bayesian_rating: number;
    ranking_score: number;
  } | null;
}

function buildQueryString(params?: QueryParams): string {
  if (!params) return "";
  const cleanEntries = Object.entries(params).filter(
    ([_, v]) => v !== undefined && v !== "",
  );
  if (cleanEntries.length === 0) return "";
  return `?${new URLSearchParams(cleanEntries.map(([k, v]) => [k, String(v)])).toString()}`;
}

export class FloriaApiClient {
  private baseUrl: string;
  private getAccessToken?: () => Promise<string | null> | string | null;
  private customFetch: typeof fetch;
  private pendingGetRequests = new Map<string, Promise<ApiResponse<any>>>();
  private staticCache = new Map<
    string,
    { timestamp: number; data: ApiResponse<any> }
  >();

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.getAccessToken = config.getAccessToken;
    const fn =
      config.fetch ||
      (typeof window !== "undefined" ? window.fetch : globalThis.fetch);
    this.customFetch =
      typeof window !== "undefined" ? fn.bind(window) : fn.bind(globalThis);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const isGet = !options.method || options.method.toUpperCase() === "GET";
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    // Static cache for catalog categories (60s)
    if (isGet && endpoint.includes("/catalog/categories")) {
      const cached = this.staticCache.get(url);
      if (cached && Date.now() - cached.timestamp < 60000) {
        return cached.data as ApiResponse<T>;
      }
    }

    // Request deduplication for identical in-flight GET requests
    if (isGet) {
      const existing = this.pendingGetRequests.get(url);
      if (existing) {
        return existing as Promise<ApiResponse<T>>;
      }
    }

    const executeRequest = async (): Promise<ApiResponse<T>> => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (this.getAccessToken) {
        try {
          const token = await this.getAccessToken();
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
        } catch {
          // Token retrieval error fallback
        }
      }

      // Add 15s timeout to release browser socket pool on Render cold starts
      const controller =
        typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller
        ? setTimeout(() => controller.abort(), 15000)
        : null;

      try {
        const fetchFn =
          this.customFetch ||
          (typeof window !== "undefined"
            ? window.fetch.bind(window)
            : globalThis.fetch.bind(globalThis));
        const response = await fetchFn(url, {
          ...options,
          headers,
          signal: controller?.signal || options.signal,
        });

        if (timeoutId) clearTimeout(timeoutId);

        const json = await response.json();
        const apiRes = json as ApiResponse<T>;

        if (
          isGet &&
          endpoint.includes("/catalog/categories") &&
          apiRes.success
        ) {
          this.staticCache.set(url, { timestamp: Date.now(), data: apiRes });
        }

        return apiRes;
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        const isAbort = error?.name === "AbortError";
        return {
          success: false,
          error: {
            code: isAbort ? "REQUEST_TIMEOUT" : "NETWORK_ERROR",
            message: isAbort
              ? "Request timed out waiting for server response."
              : error instanceof Error
                ? error.message
                : "Network request failed",
          },
        };
      } finally {
        if (isGet) {
          this.pendingGetRequests.delete(url);
        }
      }
    };

    if (isGet) {
      const promise = executeRequest();
      this.pendingGetRequests.set(url, promise);
      return promise;
    }

    return executeRequest();
  }

  // Health check
  public async getHealth(): Promise<
    ApiResponse<{ status: string; service: string }>
  > {
    return this.request<{ status: string; service: string }>("/health");
  }

  public async getReadiness(): Promise<
    ApiResponse<{ status: string; database: string }>
  > {
    return this.request<{ status: string; database: string }>("/ready");
  }

  // Public Catalog API (/api/v1/catalog)
  public async getProducts(
    params?: QueryParams,
    options: RequestInit = {},
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/catalog/products${buildQueryString(params)}`,
      options,
    );
  }

  public async getProductBySlug(
    slug: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/catalog/products/${slug}`, options);
  }

  public async getCategories(
    options: RequestInit = {},
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/catalog/categories", options);
  }

  public async getNurseries(
    options: RequestInit = {},
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/catalog/sellers", options);
  }

  public async getNurseryById(
    id: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/catalog/sellers/${id}`, options);
  }

  // Customer Cart API (/api/v1/customer/cart)
  public async getCart(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/cart");
  }

  public async addToCart(
    productId: string,
    quantity: number,
  ): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
  }

  public async updateCartQuantity(
    productId: string,
    quantity: number,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/customer/cart/items/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  }

  public async removeFromCart(productId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/customer/cart/items/${productId}`, {
      method: "DELETE",
    });
  }

  public async clearCart(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/cart", {
      method: "DELETE",
    });
  }

  public async mergeCart(
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/cart/merge", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  }

  // Customer Wishlist API (/api/v1/customer/wishlist)
  public async getWishlist(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/wishlist");
  }

  public async addToWishlist(productId: string): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/wishlist/items", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
  }

  public async removeFromWishlist(
    productId: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/customer/wishlist/items/${productId}`, {
      method: "DELETE",
    });
  }

  public async mergeWishlist(productIds: string[]): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/wishlist/merge", {
      method: "POST",
      body: JSON.stringify({ productIds }),
    });
  }

  // Customer Profile & Addresses (/api/v1/customer/users)
  public async getProfile(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/users/me");
  }

  public async updateProfile(data: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public async deleteAccount(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/users/me", {
      method: "DELETE",
    });
  }

  public async getAddresses(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/customer/users/addresses");
  }

  public async createAddress(addressData: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/users/addresses", {
      method: "POST",
      body: JSON.stringify(addressData),
    });
  }

  public async updateAddress(
    addressId: string,
    addressData: any,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/customer/users/addresses/${addressId}`, {
      method: "PATCH",
      body: JSON.stringify(addressData),
    });
  }

  public async setDefaultAddress(
    addressId: string,
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/customer/users/addresses/${addressId}/default`,
      {
        method: "PATCH",
      },
    );
  }

  public async deleteAddress(addressId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/customer/users/addresses/${addressId}`,
      {
        method: "DELETE",
      },
    );
  }

  // Customer Checkout & Orders
  public async createCheckout(data: {
    addressId?: string;
    address?: any;
    paymentMethod: "online" | "cod";
  }): Promise<ApiResponse<{ orderId: string }>> {
    return this.request<{ orderId: string }>("/api/v1/customer/checkout", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Cashfree Payment Session & Verification
  public async createPaymentSession(orderId: string): Promise<
    ApiResponse<{
      paymentId: string;
      paymentSessionId: string;
      cfOrderId: string;
      orderId: string;
      amountPaise: number;
      currency: string;
      environment: "SANDBOX" | "PRODUCTION";
    }>
  > {
    return this.request<any>("/api/v1/payments/create-session", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
  }

  public async getOrderByCfOrderId(
    cfOrderId: string,
  ): Promise<ApiResponse<{ orderId: string }>> {
    return this.request<{ orderId: string }>(
      `/api/v1/payments/lookup-order?cf_order_id=${encodeURIComponent(cfOrderId)}`,
    );
  }

  public async getPaymentStatus(paymentId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/payments/${paymentId}/status`);
  }

  public async requestRefund(
    paymentId: string,
    amountPaise: number,
    reason?: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/payments/${paymentId}/refund`, {
      method: "POST",
      body: JSON.stringify({ amountPaise, reason }),
    });
  }

  public async getAdminTransactions(params?: {
    status?: string;
    search?: string;
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.limit) query.set("limit", String(params.limit));
    const qStr = query.toString();
    return this.request<any[]>(
      `/api/v1/payments/admin/all${qStr ? `?${qStr}` : ""}`,
    );
  }

  // Admin Media & Images Management
  public async getAdminMedia(params?: {
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    const qStr = query.toString();
    return this.request<any>(`/api/v1/admin/media${qStr ? `?${qStr}` : ""}`);
  }

  public async updateAdminMedia(
    id: string,
    data: { filename?: string; altText?: string; category?: string },
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/media/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public async deleteAdminMedia(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/media/${id}`, {
      method: "DELETE",
    });
  }

  public async uploadAdminMedia(data: {
    filename: string;
    mimeType: string;
    base64Data: string;
    profile?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/admin/media/upload", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async getOrders(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/customer/orders");
  }

  public async getOrderById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/customer/orders/${id}`);
  }

  // Seller API (/api/v1/seller)
  public async getSellerProfile(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/seller/profile");
  }

  public async updateSellerProfile(data: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/seller/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public async submitSellerApplication(data: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/seller/applications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async getSellerApplication(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/seller/applications");
  }

  public async getSellerProducts(
    params?: QueryParams,
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/seller/products${buildQueryString(params)}`,
    );
  }

  public async getSellerProductById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/seller/products/${id}`);
  }

  public async createSellerProduct(data: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/seller/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async updateSellerProduct(
    id: string,
    data: any,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/seller/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public async deleteSellerProduct(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/seller/products/${id}`, {
      method: "DELETE",
    });
  }

  public async updateSellerProductStatus(
    id: string,
    status: "active" | "draft" | "inactive",
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/seller/products/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // ── SELLER PRODUCT MEDIA INTEGRATION (STAGE 8) ───────────────────────────

  public async createMediaUploadSession(params: {
    profile: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/media/upload-session", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  public async completeMediaUploadSession(
    sessionId: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(
      `/api/v1/media/upload-session/${sessionId}/complete`,
      {
        method: "POST",
      },
    );
  }

  public async getMediaUploadSessionStatus(
    sessionId: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/media/upload-session/${sessionId}`);
  }

  public async attachProductImage(
    productId: string,
    params: {
      assetId: string;
      altText?: string;
      isPrimary?: boolean;
      displayOrder?: number;
    },
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/seller/products/${productId}/images`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  public async removeProductImage(
    productId: string,
    imageId: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(
      `/api/v1/seller/products/${productId}/images/${imageId}`,
      {
        method: "DELETE",
      },
    );
  }

  public async reorderProductImages(
    productId: string,
    imageOrders: Array<{ imageId: string; displayOrder: number }>,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(
      `/api/v1/seller/products/${productId}/images/reorder`,
      {
        method: "PATCH",
        body: JSON.stringify({ imageOrders }),
      },
    );
  }

  public async setPrimaryProductImage(
    productId: string,
    imageId: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(
      `/api/v1/seller/products/${productId}/images/${imageId}/primary`,
      {
        method: "PATCH",
      },
    );
  }

  public async replaceProductImage(
    productId: string,
    imageId: string,
    params: { assetId: string; altText?: string },
  ): Promise<ApiResponse<any>> {
    return this.request<any>(
      `/api/v1/seller/products/${productId}/images/${imageId}`,
      {
        method: "PUT",
        body: JSON.stringify(params),
      },
    );
  }

  // ── STAGE 9 REMAINING MEDIA DOMAIN INTEGRATIONS ─────────────────────────

  public async updateSellerLogo(assetId: string): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/media/seller-logo", {
      method: "PATCH",
      body: JSON.stringify({ assetId }),
    });
  }

  public async updateUserAvatar(assetId: string): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/media/user-avatar", {
      method: "PATCH",
      body: JSON.stringify({ assetId }),
    });
  }

  public async updateCategoryBanner(
    categoryId: string,
    assetId: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/media/category-banner/${categoryId}`, {
      method: "PATCH",
      body: JSON.stringify({ assetId }),
    });
  }

  public async attachReviewImage(
    reviewId: string,
    assetId: string,
    displayOrder = 0,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/media/reviews/${reviewId}/images`, {
      method: "POST",
      body: JSON.stringify({ assetId, displayOrder }),
    });
  }

  public async attachSellerDocument(
    documentType: string,
    fileAssetId: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/media/seller-documents", {
      method: "POST",
      body: JSON.stringify({ documentType, fileAssetId }),
    });
  }

  public async getSignedDocumentUrl(
    documentId: string,
  ): Promise<ApiResponse<{ signedUrl: string; filename?: string }>> {
    return this.request<{ signedUrl: string; filename?: string }>(
      `/api/v1/media/seller-documents/${documentId}/download`,
    );
  }

  public async updateNurseryBanner(assetId: string): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/media/nursery-banner", {
      method: "PATCH",
      body: JSON.stringify({ assetId }),
    });
  }

  public async getSellerInventory(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/seller/inventory");
  }

  public async updateSellerInventory(
    productId: string,
    data: any,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/seller/inventory/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public async getSellerOrders(
    params?: QueryParams,
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/seller/orders${buildQueryString(params)}`,
    );
  }

  public async getSellerOrderById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/seller/orders/${id}`);
  }

  public async updateFulfillmentStatus(
    masterOrderId: string,
    newStatus: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/seller/fulfillment", {
      method: "POST",
      body: JSON.stringify({ masterOrderId, newStatus }),
    });
  }

  public async getSellerDashboard(): Promise<ApiResponse<SellerDashboardData>> {
    return this.request<SellerDashboardData>("/api/v1/seller/dashboard");
  }

  public async getSellerEarnings(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/seller/earnings");
  }

  public async getSellerPayouts(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/seller/payouts");
  }

  public async getSellerAnalytics(
    params?: QueryParams,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(
      `/api/v1/seller/analytics${buildQueryString(params)}`,
    );
  }

  public async getSellerDocuments(): Promise<ApiResponse<SellerDocument[]>> {
    return this.request<SellerDocument[]>("/api/v1/seller/documents");
  }

  public async uploadSellerDocument(data: {
    documentType: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }): Promise<ApiResponse<SellerDocument>> {
    return this.request<SellerDocument>("/api/v1/seller/documents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async getSellerNotificationSettings(): Promise<
    ApiResponse<SellerNotificationSettings>
  > {
    return this.request<SellerNotificationSettings>(
      "/api/v1/seller/settings/notifications",
    );
  }

  public async updateSellerNotificationSettings(
    settings: Partial<SellerNotificationSettings>,
  ): Promise<ApiResponse<SellerNotificationSettings>> {
    return this.request<SellerNotificationSettings>(
      "/api/v1/seller/settings/notifications",
      {
        method: "PATCH",
        body: JSON.stringify(settings),
      },
    );
  }

  // ── Notifications API (/api/v1/notifications) ─────────────────────────────
  public async getNotifications(
    params?: QueryParams,
  ): Promise<ApiResponse<NotificationListResponse>> {
    return this.request<NotificationListResponse>(
      `/api/v1/notifications${buildQueryString(params)}`,
    );
  }

  public async getUnreadNotificationCount(): Promise<
    ApiResponse<{ unreadCount: number }>
  > {
    return this.request<{ unreadCount: number }>(
      "/api/v1/notifications/unread-count",
    );
  }

  public async markNotificationRead(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/notifications/${id}/read`, {
      method: "PATCH",
    });
  }

  public async markAllNotificationsRead(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/notifications/read-all", {
      method: "PATCH",
    });
  }

  public async deleteNotification(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/notifications/${id}`, {
      method: "DELETE",
    });
  }

  public getRealtimeStreamUrl(): string {
    return `${this.baseUrl}/api/v1/notifications/stream`;
  }

  // ── Admin API (/api/v1/admin) ─────────────────────────────────────────────
  public async getAdminHealth(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/admin/health");
  }

  public async getAdminDashboard(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/admin/dashboard");
  }

  public async getAdminAnalytics(
    params?: QueryParams,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(
      `/api/v1/admin/analytics${buildQueryString(params)}`,
    );
  }

  public async updateAdminUser(
    id: string,
    payload: any,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  public async updateAdminSeller(
    id: string,
    payload: any,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/sellers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  public async updateAdminProduct(
    id: string,
    payload: any,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  public async updateAdminOrder(
    id: string,
    payload: any,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  public async getAdminUsers(
    params?: QueryParams,
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/admin/users${buildQueryString(params)}`,
    );
  }

  public async getAdminUserById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/users/${id}`);
  }

  public async updateAdminUserStatus(
    id: string,
    status: "active" | "suspended",
    rationale?: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rationale }),
    });
  }

  public async getAdminSellers(
    params?: QueryParams,
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/admin/sellers${buildQueryString(params)}`,
    );
  }

  public async getAdminSellerById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/sellers/${id}`);
  }

  public async approveSeller(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/sellers/${id}/approve`, {
      method: "POST",
    });
  }

  public async rejectSeller(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/sellers/${id}/reject`, {
      method: "POST",
    });
  }

  public async suspendSeller(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/sellers/${id}/suspend`, {
      method: "POST",
    });
  }

  public async reactivateSeller(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/sellers/${id}/reactivate`, {
      method: "POST",
    });
  }

  public async getAdminSellerDocuments(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/sellers/${id}/documents`);
  }

  public async getAdminProducts(
    params?: QueryParams,
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/admin/products${buildQueryString(params)}`,
    );
  }

  public async getAdminProductById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}`);
  }

  public async updateAdminProductStatus(
    id: string,
    status: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  public async publishProduct(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}/publish`, {
      method: "PATCH",
    });
  }

  public async unpublishProduct(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}/unpublish`, {
      method: "PATCH",
    });
  }

  public async archiveProduct(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}/archive`, {
      method: "PATCH",
    });
  }

  public async getAdminCategories(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/admin/categories");
  }

  public async getCategoryProductsCount(
    id: string,
  ): Promise<ApiResponse<{ categoryId: string; activeProductsCount: number }>> {
    return this.request<{ categoryId: string; activeProductsCount: number }>(
      `/api/v1/admin/categories/${id}/products-count`,
    );
  }

  public async createAdminCategory(data: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async updateAdminCategory(
    id: string,
    data: any,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public async getAdminOrders(
    params?: QueryParams,
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/admin/orders${buildQueryString(params)}`,
    );
  }

  public async getAdminOrderById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/orders/${id}`);
  }

  public async getAuditLogs(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/admin/audit-logs${buildQueryString(params)}`,
    );
  }

  public async getPlatformSettings(): Promise<
    ApiResponse<{ commissionRate: number }>
  > {
    return this.request<{ commissionRate: number }>(
      "/api/v1/admin/settings/platform",
    );
  }

  public async updateCommissionRate(
    commissionRate: number,
  ): Promise<ApiResponse<{ commissionRate: number }>> {
    return this.request<{ commissionRate: number }>(
      "/api/v1/admin/settings/commission",
      {
        method: "PATCH",
        body: JSON.stringify({ commissionRate }),
      },
    );
  }

  // ── Operations API (/api/v1/operations) ──────────────────────────────────
  public async getOperationsHealth(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/operations/health");
  }

  public async getOperationsDashboard(): Promise<
    ApiResponse<{
      pendingPickup: number;
      packing: number;
      outForDelivery: number;
      delivered: number;
      totalActiveDeliveries: number;
    }>
  > {
    return this.request<{
      pendingPickup: number;
      packing: number;
      outForDelivery: number;
      delivered: number;
      totalActiveDeliveries: number;
    }>("/api/v1/operations/dashboard");
  }

  public async getOperationsOrders(
    params?: QueryParams,
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/operations/orders${buildQueryString(params)}`,
    );
  }

  public async getOperationsOrderById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/orders/${id}`);
  }

  public async updateOperationsOrderStatus(
    id: string,
    status: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/orders/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }

  public async getPickups(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/operations/pickups${buildQueryString(params)}`,
    );
  }

  public async updatePickupStatus(
    id: string,
    status: string,
    notes?: string,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/pickups/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
    });
  }

  public async getPackingTasks(
    params?: QueryParams,
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/operations/packing${buildQueryString(params)}`,
    );
  }

  public async updatePackingTask(
    id: string,
    status: string,
    verifiedItemsCount?: number,
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/packing/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, verifiedItemsCount }),
    });
  }

  public async getDeliveries(
    params?: QueryParams,
  ): Promise<ApiResponse<import("@floria/types").DeliveryAssignment[]>> {
    return this.request<import("@floria/types").DeliveryAssignment[]>(
      `/api/v1/operations/deliveries${buildQueryString(params)}`,
    );
  }

  public async getDeliveryById(
    id: string,
  ): Promise<ApiResponse<import("@floria/types").DeliveryAssignment>> {
    return this.request<import("@floria/types").DeliveryAssignment>(
      `/api/v1/operations/deliveries/${id}`,
    );
  }

  public async assignDelivery(
    id: string,
    data: { assignedTo: string },
  ): Promise<ApiResponse<import("@floria/types").DeliveryAssignment>> {
    return this.request<import("@floria/types").DeliveryAssignment>(
      `/api/v1/operations/deliveries/${id}/assign`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  public async reassignDelivery(
    id: string,
    data: { assignedTo: string },
  ): Promise<ApiResponse<import("@floria/types").DeliveryAssignment>> {
    return this.request<import("@floria/types").DeliveryAssignment>(
      `/api/v1/operations/deliveries/${id}/reassign`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  public async updateDeliveryStatus(
    id: string,
    status: import("@floria/types").DeliveryAssignmentStatus | string,
  ): Promise<ApiResponse<import("@floria/types").DeliveryAssignment>> {
    return this.request<import("@floria/types").DeliveryAssignment>(
      `/api/v1/operations/deliveries/${id}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status }),
      },
    );
  }

  public async completeDeliveryWithPod(
    id: string,
    data: import("@floria/types").CompleteDeliveryPayload,
  ): Promise<ApiResponse<import("@floria/types").DeliveryAssignment>> {
    return this.request<import("@floria/types").DeliveryAssignment>(
      `/api/v1/operations/deliveries/${id}/complete`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  }

  public async getDeliveryPod(
    id: string,
  ): Promise<ApiResponse<import("@floria/types").DeliveryPodDetails>> {
    return this.request<import("@floria/types").DeliveryPodDetails>(
      `/api/v1/operations/deliveries/${id}/pod`,
    );
  }

  // ── Media Upload Sessions (/api/v1/media) ──────────────────────────────────
  public async createUploadSession(data: {
    profile: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<
    ApiResponse<{
      sessionId: string;
      assetId: string;
      stagingPath: string;
      signedUploadUrl?: string;
      expiresAt: string;
    }>
  > {
    return this.request<{
      sessionId: string;
      assetId: string;
      stagingPath: string;
      signedUploadUrl?: string;
      expiresAt: string;
    }>("/api/v1/media/upload-session", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async completeUploadSession(sessionId: string): Promise<
    ApiResponse<{
      sessionId: string;
      assetId: string;
      sessionStatus: string;
      assetStatus: string;
      deduplicated: boolean;
    }>
  > {
    return this.request<{
      sessionId: string;
      assetId: string;
      sessionStatus: string;
      assetStatus: string;
      deduplicated: boolean;
    }>(`/api/v1/media/upload-session/${sessionId}/complete`, {
      method: "POST",
    });
  }

  // ── REVIEWS & RATINGS ─────────────────────────────────────────────────────

  public async getProductReviews(
    productId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<ApiResponse<ReviewListResponse>> {
    return this.request<ReviewListResponse>(
      `/api/v1/catalog/products/${productId}/reviews${buildQueryString(params)}`,
    );
  }

  public async getReviewEligibility(
    productId: string,
  ): Promise<
    ApiResponse<{
      canReview: boolean;
      reason?: string;
      userReview?: ProductReview | null;
    }>
  > {
    return this.request<{
      canReview: boolean;
      reason?: string;
      userReview?: ProductReview | null;
    }>(`/api/v1/catalog/products/${productId}/review-eligibility`);
  }

  public async submitReview(
    productId: string,
    payload: { rating: number; title?: string; body?: string },
  ): Promise<ApiResponse<{ id: string; status: string; created_at: string }>> {
    return this.request(`/api/v1/catalog/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  public async updateMyReview(
    reviewId: string,
    payload: { rating?: number; title?: string; body?: string },
  ): Promise<ApiResponse<ProductReview>> {
    return this.request<ProductReview>(`/api/v1/customer/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  public async markReviewHelpful(
    productId: string,
    reviewId: string,
  ): Promise<ApiResponse<{ action: "added" | "removed" }>> {
    return this.request(
      `/api/v1/catalog/products/${productId}/reviews/${reviewId}/helpful`,
      {
        method: "POST",
      },
    );
  }

  public async getMyReviews(params?: {
    page?: number;
  }): Promise<ApiResponse<ReviewListResponse>> {
    return this.request<ReviewListResponse>(
      `/api/v1/customer/reviews${buildQueryString(params)}`,
    );
  }

  public async getSellerReviews(params?: {
    page?: number;
  }): Promise<ApiResponse<ReviewListResponse>> {
    return this.request<ReviewListResponse>(
      `/api/v1/seller/reviews${buildQueryString(params)}`,
    );
  }

  public async flagReview(
    reviewId: string,
  ): Promise<ApiResponse<{ flagged: boolean }>> {
    return this.request(`/api/v1/seller/reviews/${reviewId}/flag`, {
      method: "PATCH",
    });
  }

  public async adminGetReviews(params?: {
    status?: string;
    productId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<ReviewListResponse>> {
    return this.request<ReviewListResponse>(
      `/api/v1/admin/reviews${buildQueryString(params)}`,
    );
  }

  public async adminModerateReview(
    reviewId: string,
    action: "approve" | "reject" | "hide",
    note?: string,
  ): Promise<ApiResponse<{ moderated: boolean }>> {
    return this.request(`/api/v1/admin/reviews/${reviewId}`, {
      method: "PATCH",
      body: JSON.stringify({ action, note }),
    });
  }

  // ── CATALOG: TRENDING, RELATED, RANKED NURSERIES ─────────────────────────

  public async getTrendingProducts(
    params?: { limit?: number },
    options: RequestInit = {},
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/catalog/products/trending${buildQueryString(params)}`,
      options,
    );
  }

  public async getRelatedProducts(
    slug: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(
      `/api/v1/catalog/products/${slug}/related`,
      options,
    );
  }

  public async getRankedNurseries(
    options: RequestInit = {},
  ): Promise<ApiResponse<NurserySummary[]>> {
    return this.request<NurserySummary[]>(`/api/v1/catalog/sellers`, options);
  }

  // ── ADMIN FINANCIAL TRANSPARENCY ─────────────────────────────────────────

  public async getAdminProductFinancialCalculation(
    productId: string,
  ): Promise<
    ApiResponse<import("@floria/types").AdminProductFinancialCalculation>
  > {
    return this.request<
      import("@floria/types").AdminProductFinancialCalculation
    >(`/api/v1/admin/products/${productId}/financial-calculation`);
  }

  public async getAdminOrderFinancialBreakdown(
    orderId: string,
  ): Promise<
    ApiResponse<import("@floria/types").AdminOrderFinancialBreakdown>
  > {
    return this.request<import("@floria/types").AdminOrderFinancialBreakdown>(
      `/api/v1/admin/orders/${orderId}/financial-breakdown`,
    );
  }

  // ── DELIVERY FEE ENGINE & POLICY ─────────────────────────────────────────

  public async getDeliverySettings(): Promise<
    ApiResponse<import("@floria/types").DeliverySettings>
  > {
    return this.request<import("@floria/types").DeliverySettings>(
      "/api/v1/admin/settings/delivery",
    );
  }

  public async updateDeliverySettings(
    updates: Partial<import("@floria/types").DeliverySettings>,
  ): Promise<ApiResponse<import("@floria/types").DeliverySettings>> {
    return this.request<import("@floria/types").DeliverySettings>(
      "/api/v1/admin/settings/delivery",
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
    );
  }

  public async previewDeliveryFee(
    subtotalPaise: number,
  ): Promise<ApiResponse<import("@floria/types").DeliveryCalculationResult>> {
    return this.request<import("@floria/types").DeliveryCalculationResult>(
      "/api/v1/admin/delivery/preview",
      {
        method: "POST",
        body: JSON.stringify({ subtotalPaise }),
      },
    );
  }

  // ── FINANCIAL SETTINGS & UNIFIED PRICING ENGINE ───────────────────────────

  public async getFinancialSettings(): Promise<
    ApiResponse<import("@floria/types").FinancialSettings>
  > {
    return this.request<import("@floria/types").FinancialSettings>(
      "/api/v1/admin/settings/financials",
    );
  }

  public async updateFinancialSettings(
    updates: Partial<import("@floria/types").FinancialSettings>,
  ): Promise<ApiResponse<import("@floria/types").FinancialSettings>> {
    return this.request<import("@floria/types").FinancialSettings>(
      "/api/v1/admin/settings/financials",
      {
        method: "PATCH",
        body: JSON.stringify(updates),
      },
    );
  }

  // ── VERSIONED PRICING POLICIES (PHASE 3.23) ───────────────────────────────

  public async getPricingPolicies(): Promise<
    ApiResponse<{ policies: import("@floria/types").PricingPolicyVersion[] }>
  > {
    return this.request<{
      policies: import("@floria/types").PricingPolicyVersion[];
    }>("/api/v1/admin/pricing-policies");
  }

  public async getActivePricingPolicy(): Promise<
    ApiResponse<import("@floria/types").PricingPolicyVersion | null>
  > {
    return this.request<import("@floria/types").PricingPolicyVersion | null>(
      "/api/v1/admin/pricing-policies/active",
    );
  }

  public async createPricingPolicyDraft(params: {
    sellerCommissionRate: number;
    floriaProfitRate: number;
    platformMaintenanceFeePaise: number;
    freeDeliveryThresholdPaise: number;
    freeDeliveryRecoveryPaise: number;
    notes?: string;
  }): Promise<ApiResponse<import("@floria/types").PricingPolicyVersion>> {
    return this.request<import("@floria/types").PricingPolicyVersion>(
      "/api/v1/admin/pricing-policies",
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
  }

  public async previewPricingPolicyImpact(
    policyId: string,
  ): Promise<ApiResponse<import("@floria/types").PolicyImpactPreview>> {
    return this.request<import("@floria/types").PolicyImpactPreview>(
      `/api/v1/admin/pricing-policies/${policyId}/preview`,
    );
  }

  public async startPricingRecalculation(
    policyId: string,
  ): Promise<ApiResponse<import("@floria/types").PricingRecalculationJob>> {
    return this.request<import("@floria/types").PricingRecalculationJob>(
      `/api/v1/admin/pricing-policies/${policyId}/recalculate`,
      { method: "POST" },
    );
  }

  public async getPricingRecalculationStatus(
    policyId: string,
  ): Promise<
    ApiResponse<import("@floria/types").PricingRecalculationJob | null>
  > {
    return this.request<import("@floria/types").PricingRecalculationJob | null>(
      `/api/v1/admin/pricing-policies/${policyId}/recalculation-status`,
    );
  }

  public async activatePricingPolicy(
    policyId: string,
  ): Promise<ApiResponse<import("@floria/types").PricingPolicyVersion>> {
    return this.request<import("@floria/types").PricingPolicyVersion>(
      `/api/v1/admin/pricing-policies/${policyId}/activate`,
      { method: "POST" },
    );
  }

  public async setPricingOverride(params: {
    productId: string;
    customCustomerPricePaise: number;
    reason: string;
  }): Promise<ApiResponse<import("@floria/types").ProductPricingOverride>> {
    return this.request<import("@floria/types").ProductPricingOverride>(
      "/api/v1/admin/pricing-policies/overrides",
      {
        method: "POST",
        body: JSON.stringify(params),
      },
    );
  }

  public async removePricingOverride(
    productId: string,
  ): Promise<ApiResponse<{ removed: boolean }>> {
    return this.request<{ removed: boolean }>(
      `/api/v1/admin/pricing-policies/overrides/${productId}`,
      { method: "DELETE" },
    );
  }
}

export type {
  DeliveryAssignment,
  DeliveryAssignmentStatus,
  DeliveryListParams,
  UpdateDeliveryStatusPayload,
  CompleteDeliveryPayload,
  DeliveryPodDetails,
} from "@floria/types";
