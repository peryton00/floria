interface ApiClientConfig {
    baseUrl: string;
    getAccessToken?: () => Promise<string | null> | string | null;
    fetch?: typeof fetch;
}
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}
type QueryParams = Record<string, string | number | boolean | undefined>;
interface SellerDashboardData {
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
declare class FloriaApiClient {
    private baseUrl;
    private getAccessToken?;
    private customFetch;
    constructor(config: ApiClientConfig);
    private request;
    getHealth(): Promise<ApiResponse<{
        status: string;
        service: string;
    }>>;
    getReadiness(): Promise<ApiResponse<{
        status: string;
        database: string;
    }>>;
    getProducts(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getProductBySlug(slug: string): Promise<ApiResponse<any>>;
    getCategories(): Promise<ApiResponse<any[]>>;
    getCart(): Promise<ApiResponse<any>>;
    addToCart(productId: string, quantity: number): Promise<ApiResponse<any>>;
    updateCartQuantity(productId: string, quantity: number): Promise<ApiResponse<any>>;
    removeFromCart(productId: string): Promise<ApiResponse<any>>;
    clearCart(): Promise<ApiResponse<any>>;
    mergeCart(items: Array<{
        productId: string;
        quantity: number;
    }>): Promise<ApiResponse<any>>;
    getWishlist(): Promise<ApiResponse<any>>;
    addToWishlist(productId: string): Promise<ApiResponse<any>>;
    removeFromWishlist(productId: string): Promise<ApiResponse<any>>;
    mergeWishlist(productIds: string[]): Promise<ApiResponse<any>>;
    getProfile(): Promise<ApiResponse<any>>;
    updateProfile(data: any): Promise<ApiResponse<any>>;
    deleteAccount(): Promise<ApiResponse<any>>;
    getAddresses(): Promise<ApiResponse<any[]>>;
    createAddress(addressData: any): Promise<ApiResponse<any>>;
    updateAddress(addressId: string, addressData: any): Promise<ApiResponse<any>>;
    setDefaultAddress(addressId: string): Promise<ApiResponse<any[]>>;
    deleteAddress(addressId: string): Promise<ApiResponse<any[]>>;
    createCheckout(data: {
        addressId?: string;
        address?: any;
        paymentMethod: "online" | "cod";
    }): Promise<ApiResponse<{
        orderId: string;
    }>>;
    getOrders(): Promise<ApiResponse<any[]>>;
    getOrderById(id: string): Promise<ApiResponse<any>>;
    getSellerProfile(): Promise<ApiResponse<any>>;
    updateSellerProfile(data: any): Promise<ApiResponse<any>>;
    submitSellerApplication(data: any): Promise<ApiResponse<any>>;
    getSellerProducts(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getSellerProductById(id: string): Promise<ApiResponse<any>>;
    createSellerProduct(data: any): Promise<ApiResponse<any>>;
    updateSellerProduct(id: string, data: any): Promise<ApiResponse<any>>;
    deleteSellerProduct(id: string): Promise<ApiResponse<any>>;
    updateSellerProductStatus(id: string, status: "active" | "draft" | "inactive"): Promise<ApiResponse<any>>;
    getSellerInventory(): Promise<ApiResponse<any[]>>;
    updateSellerInventory(productId: string, data: any): Promise<ApiResponse<any>>;
    getSellerOrders(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getSellerOrderById(id: string): Promise<ApiResponse<any>>;
    updateFulfillmentStatus(masterOrderId: string, newStatus: string): Promise<ApiResponse<any>>;
    getSellerDashboard(): Promise<ApiResponse<SellerDashboardData>>;
    getAdminHealth(): Promise<ApiResponse<any>>;
    getAdminDashboard(): Promise<ApiResponse<any>>;
    getAdminUsers(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getAdminUserById(id: string): Promise<ApiResponse<any>>;
    updateAdminUserStatus(id: string, status: "active" | "suspended", rationale?: string): Promise<ApiResponse<any>>;
    getAdminSellers(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getAdminSellerById(id: string): Promise<ApiResponse<any>>;
    approveSeller(id: string): Promise<ApiResponse<any>>;
    rejectSeller(id: string): Promise<ApiResponse<any>>;
    suspendSeller(id: string): Promise<ApiResponse<any>>;
    reactivateSeller(id: string): Promise<ApiResponse<any>>;
    getSellerDocuments(id: string): Promise<ApiResponse<any>>;
    getAdminProducts(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getAdminProductById(id: string): Promise<ApiResponse<any>>;
    updateAdminProductStatus(id: string, status: string): Promise<ApiResponse<any>>;
    publishProduct(id: string): Promise<ApiResponse<any>>;
    unpublishProduct(id: string): Promise<ApiResponse<any>>;
    archiveProduct(id: string): Promise<ApiResponse<any>>;
    getAdminCategories(): Promise<ApiResponse<any[]>>;
    getCategoryProductsCount(id: string): Promise<ApiResponse<{
        categoryId: string;
        activeProductsCount: number;
    }>>;
    createAdminCategory(data: any): Promise<ApiResponse<any>>;
    updateAdminCategory(id: string, data: any): Promise<ApiResponse<any>>;
    getAdminOrders(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getAdminOrderById(id: string): Promise<ApiResponse<any>>;
    getAuditLogs(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getPlatformSettings(): Promise<ApiResponse<{
        commissionRate: number;
    }>>;
    updateCommissionRate(commissionRate: number): Promise<ApiResponse<{
        commissionRate: number;
    }>>;
    getOperationsHealth(): Promise<ApiResponse<any>>;
    getOperationsDashboard(): Promise<ApiResponse<any>>;
    getOperationsOrders(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getOperationsOrderById(id: string): Promise<ApiResponse<any>>;
    updateOperationsOrderStatus(id: string, status: string): Promise<ApiResponse<any>>;
    getPickups(params?: QueryParams): Promise<ApiResponse<any[]>>;
    updatePickupStatus(id: string, status: string, notes?: string): Promise<ApiResponse<any>>;
    getPackingTasks(params?: QueryParams): Promise<ApiResponse<any[]>>;
    updatePackingTask(id: string, status: string, verifiedItemsCount?: number): Promise<ApiResponse<any>>;
    getDeliveries(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getDeliveryById(id: string): Promise<ApiResponse<any>>;
    assignDelivery(id: string, data: {
        assignedTo: string;
    }): Promise<ApiResponse<any>>;
    reassignDelivery(id: string, data: {
        assignedTo: string;
    }): Promise<ApiResponse<any>>;
    updateDeliveryStatus(id: string, status: string): Promise<ApiResponse<any>>;
}

export { type ApiClientConfig, type ApiResponse, FloriaApiClient, type QueryParams, type SellerDashboardData };
