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

function buildQueryString(params?: QueryParams): string {
  if (!params) return "";
  const cleanEntries = Object.entries(params).filter(([_, v]) => v !== undefined && v !== "");
  if (cleanEntries.length === 0) return "";
  return `?${new URLSearchParams(cleanEntries.map(([k, v]) => [k, String(v)])).toString()}`;
}

export class FloriaApiClient {
  private baseUrl: string;
  private getAccessToken?: () => Promise<string | null> | string | null;
  private customFetch: typeof fetch;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.getAccessToken = config.getAccessToken;
    const fn = config.fetch || (typeof window !== "undefined" ? window.fetch : globalThis.fetch);
    this.customFetch = typeof window !== "undefined" ? fn.bind(window) : fn.bind(globalThis);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
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
        headers,
      });

      const json = await response.json();
      return json as ApiResponse<T>;
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network request failed",
        },
      };
    }
  }

  // Health check
  public async getHealth(): Promise<ApiResponse<{ status: string; service: string }>> {
    return this.request<{ status: string; service: string }>("/health");
  }

  public async getReadiness(): Promise<ApiResponse<{ status: string; database: string }>> {
    return this.request<{ status: string; database: string }>("/ready");
  }

  // Public Catalog API (/api/v1/catalog)
  public async getProducts(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/catalog/products${buildQueryString(params)}`);
  }

  public async getProductBySlug(slug: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/catalog/products/${slug}`);
  }

  public async getCategories(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/catalog/categories");
  }

  // Customer Cart API (/api/v1/customer/cart)
  public async getCart(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/cart");
  }

  public async addToCart(productId: string, quantity: number): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/customer/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    });
  }

  public async updateCartQuantity(productId: string, quantity: number): Promise<ApiResponse<any>> {
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

  public async mergeCart(items: Array<{ productId: string; quantity: number }>): Promise<ApiResponse<any>> {
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

  public async removeFromWishlist(productId: string): Promise<ApiResponse<any>> {
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

  public async updateAddress(addressId: string, addressData: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/customer/users/addresses/${addressId}`, {
      method: "PATCH",
      body: JSON.stringify(addressData),
    });
  }

  public async setDefaultAddress(addressId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/customer/users/addresses/${addressId}/default`, {
      method: "PATCH",
    });
  }

  public async deleteAddress(addressId: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/customer/users/addresses/${addressId}`, {
      method: "DELETE",
    });
  }

  // Customer Checkout & Orders
  public async createCheckout(data: { addressId?: string; address?: any; paymentMethod: "online" | "cod" }): Promise<ApiResponse<{ orderId: string }>> {
    return this.request<{ orderId: string }>("/api/v1/customer/checkout", {
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

  public async getSellerProducts(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/seller/products${buildQueryString(params)}`);
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

  public async updateSellerProduct(id: string, data: any): Promise<ApiResponse<any>> {
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

  public async updateSellerProductStatus(id: string, status: "active" | "draft" | "inactive"): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/seller/products/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  public async getSellerInventory(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/seller/inventory");
  }

  public async updateSellerInventory(productId: string, data: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/seller/inventory/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public async getSellerOrders(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/seller/orders${buildQueryString(params)}`);
  }

  public async getSellerOrderById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/seller/orders/${id}`);
  }

  public async updateFulfillmentStatus(masterOrderId: string, newStatus: string): Promise<ApiResponse<any>> {
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

  public async getSellerAnalytics(params?: QueryParams): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/seller/analytics${buildQueryString(params)}`);
  }

  // ── Notifications API (/api/v1/notifications) ─────────────────────────────
  public async getNotifications(params?: QueryParams): Promise<ApiResponse<NotificationListResponse>> {
    return this.request<NotificationListResponse>(`/api/v1/notifications${buildQueryString(params)}`);
  }

  public async getUnreadNotificationCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    return this.request<{ unreadCount: number }>("/api/v1/notifications/unread-count");
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

  // ── Admin API (/api/v1/admin) ─────────────────────────────────────────────
  public async getAdminHealth(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/admin/health");
  }

  public async getAdminDashboard(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/admin/dashboard");
  }

  public async getAdminAnalytics(params?: QueryParams): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/analytics${buildQueryString(params)}`);
  }

  public async updateAdminUser(id: string, payload: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  public async updateAdminSeller(id: string, payload: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/sellers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  public async updateAdminProduct(id: string, payload: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  public async updateAdminOrder(id: string, payload: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  public async getAdminUsers(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/admin/users${buildQueryString(params)}`);
  }

  public async getAdminUserById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/users/${id}`);
  }

  public async updateAdminUserStatus(id: string, status: "active" | "suspended", rationale?: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, rationale }),
    });
  }

  public async getAdminSellers(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/admin/sellers${buildQueryString(params)}`);
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

  public async getSellerDocuments(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/sellers/${id}/documents`);
  }

  public async getAdminProducts(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/admin/products${buildQueryString(params)}`);
  }

  public async getAdminProductById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}`);
  }

  public async updateAdminProductStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  public async publishProduct(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}/publish`, { method: "PATCH" });
  }

  public async unpublishProduct(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}/unpublish`, { method: "PATCH" });
  }

  public async archiveProduct(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/products/${id}/archive`, { method: "PATCH" });
  }

  public async getAdminCategories(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>("/api/v1/admin/categories");
  }

  public async getCategoryProductsCount(id: string): Promise<ApiResponse<{ categoryId: string; activeProductsCount: number }>> {
    return this.request<{ categoryId: string; activeProductsCount: number }>(`/api/v1/admin/categories/${id}/products-count`);
  }

  public async createAdminCategory(data: any): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async updateAdminCategory(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  public async getAdminOrders(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/admin/orders${buildQueryString(params)}`);
  }

  public async getAdminOrderById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/admin/orders/${id}`);
  }

  public async getAuditLogs(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/admin/audit-logs${buildQueryString(params)}`);
  }

  public async getPlatformSettings(): Promise<ApiResponse<{ commissionRate: number }>> {
    return this.request<{ commissionRate: number }>("/api/v1/admin/settings/platform");
  }

  public async updateCommissionRate(commissionRate: number): Promise<ApiResponse<{ commissionRate: number }>> {
    return this.request<{ commissionRate: number }>("/api/v1/admin/settings/commission", {
      method: "PATCH",
      body: JSON.stringify({ commissionRate }),
    });
  }

  // ── Operations API (/api/v1/operations) ──────────────────────────────────
  public async getOperationsHealth(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/operations/health");
  }

  public async getOperationsDashboard(): Promise<ApiResponse<any>> {
    return this.request<any>("/api/v1/operations/dashboard");
  }

  public async getOperationsOrders(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/operations/orders${buildQueryString(params)}`);
  }

  public async getOperationsOrderById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/orders/${id}`);
  }

  public async updateOperationsOrderStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/orders/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }

  public async getPickups(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/operations/pickups${buildQueryString(params)}`);
  }

  public async updatePickupStatus(id: string, status: string, notes?: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/pickups/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, notes }),
    });
  }

  public async getPackingTasks(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/operations/packing${buildQueryString(params)}`);
  }

  public async updatePackingTask(id: string, status: string, verifiedItemsCount?: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/packing/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status, verifiedItemsCount }),
    });
  }

  public async getDeliveries(params?: QueryParams): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/api/v1/operations/deliveries${buildQueryString(params)}`);
  }

  public async getDeliveryById(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/deliveries/${id}`);
  }

  public async assignDelivery(id: string, data: { assignedTo: string }): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/deliveries/${id}/assign`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async reassignDelivery(id: string, data: { assignedTo: string }): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/deliveries/${id}/reassign`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  public async updateDeliveryStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/operations/deliveries/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }
}
