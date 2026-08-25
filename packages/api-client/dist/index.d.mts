import * as _floria_types from '@floria/types';

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
interface NotificationItem {
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
interface NotificationListResponse {
    notifications: NotificationItem[];
    total: number;
    unreadCount: number;
}
interface SellerDocument {
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
interface SellerNotificationSettings {
    seller_id: string;
    new_order_notifications: boolean;
    low_stock_notifications: boolean;
    email_notifications: boolean;
    created_at?: string;
    updated_at?: string;
}
type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";
interface ProductReview {
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
    customer?: {
        full_name: string | null;
    };
    product?: {
        id: string;
        name: string;
        slug: string;
    };
    images?: Array<{
        id: string;
        url: string;
        variants?: Record<string, string>;
    }>;
}
interface ReviewSummary {
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
interface ReviewListResponse {
    reviews: ProductReview[];
    total: number;
    summary?: ReviewSummary | null;
}
interface NurserySummary {
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
    getProducts(params?: QueryParams, options?: RequestInit): Promise<ApiResponse<any[]>>;
    getProductBySlug(slug: string, options?: RequestInit): Promise<ApiResponse<any>>;
    getCategories(options?: RequestInit): Promise<ApiResponse<any[]>>;
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
    createPaymentSession(orderId: string): Promise<ApiResponse<{
        paymentId: string;
        paymentSessionId: string;
        cfOrderId: string;
        orderId: string;
        amountPaise: number;
        currency: string;
        environment: "SANDBOX" | "PRODUCTION";
    }>>;
    getPaymentStatus(paymentId: string): Promise<ApiResponse<any>>;
    requestRefund(paymentId: string, amountPaise: number, reason?: string): Promise<ApiResponse<any>>;
    getOrders(): Promise<ApiResponse<any[]>>;
    getOrderById(id: string): Promise<ApiResponse<any>>;
    getSellerProfile(): Promise<ApiResponse<any>>;
    updateSellerProfile(data: any): Promise<ApiResponse<any>>;
    submitSellerApplication(data: any): Promise<ApiResponse<any>>;
    getSellerApplication(): Promise<ApiResponse<any>>;
    getSellerProducts(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getSellerProductById(id: string): Promise<ApiResponse<any>>;
    createSellerProduct(data: any): Promise<ApiResponse<any>>;
    updateSellerProduct(id: string, data: any): Promise<ApiResponse<any>>;
    deleteSellerProduct(id: string): Promise<ApiResponse<any>>;
    updateSellerProductStatus(id: string, status: "active" | "draft" | "inactive"): Promise<ApiResponse<any>>;
    createMediaUploadSession(params: {
        profile: string;
        filename: string;
        mimeType: string;
        sizeBytes: number;
    }): Promise<ApiResponse<any>>;
    completeMediaUploadSession(sessionId: string): Promise<ApiResponse<any>>;
    getMediaUploadSessionStatus(sessionId: string): Promise<ApiResponse<any>>;
    attachProductImage(productId: string, params: {
        assetId: string;
        altText?: string;
        isPrimary?: boolean;
        displayOrder?: number;
    }): Promise<ApiResponse<any>>;
    removeProductImage(productId: string, imageId: string): Promise<ApiResponse<any>>;
    reorderProductImages(productId: string, imageOrders: Array<{
        imageId: string;
        displayOrder: number;
    }>): Promise<ApiResponse<any>>;
    setPrimaryProductImage(productId: string, imageId: string): Promise<ApiResponse<any>>;
    replaceProductImage(productId: string, imageId: string, params: {
        assetId: string;
        altText?: string;
    }): Promise<ApiResponse<any>>;
    updateSellerLogo(assetId: string): Promise<ApiResponse<any>>;
    updateUserAvatar(assetId: string): Promise<ApiResponse<any>>;
    updateCategoryBanner(categoryId: string, assetId: string): Promise<ApiResponse<any>>;
    attachReviewImage(reviewId: string, assetId: string, displayOrder?: number): Promise<ApiResponse<any>>;
    attachSellerDocument(documentType: string, fileAssetId: string): Promise<ApiResponse<any>>;
    getSignedDocumentUrl(documentId: string): Promise<ApiResponse<{
        signedUrl: string;
        filename?: string;
    }>>;
    updateNurseryBanner(assetId: string): Promise<ApiResponse<any>>;
    getSellerInventory(): Promise<ApiResponse<any[]>>;
    updateSellerInventory(productId: string, data: any): Promise<ApiResponse<any>>;
    getSellerOrders(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getSellerOrderById(id: string): Promise<ApiResponse<any>>;
    updateFulfillmentStatus(masterOrderId: string, newStatus: string): Promise<ApiResponse<any>>;
    getSellerDashboard(): Promise<ApiResponse<SellerDashboardData>>;
    getSellerEarnings(): Promise<ApiResponse<any>>;
    getSellerPayouts(): Promise<ApiResponse<any>>;
    getSellerAnalytics(params?: QueryParams): Promise<ApiResponse<any>>;
    getSellerDocuments(): Promise<ApiResponse<SellerDocument[]>>;
    uploadSellerDocument(data: {
        documentType: string;
        fileName: string;
        fileUrl: string;
        fileSize: number;
        mimeType: string;
    }): Promise<ApiResponse<SellerDocument>>;
    getSellerNotificationSettings(): Promise<ApiResponse<SellerNotificationSettings>>;
    updateSellerNotificationSettings(settings: Partial<SellerNotificationSettings>): Promise<ApiResponse<SellerNotificationSettings>>;
    getNotifications(params?: QueryParams): Promise<ApiResponse<NotificationListResponse>>;
    getUnreadNotificationCount(): Promise<ApiResponse<{
        unreadCount: number;
    }>>;
    markNotificationRead(id: string): Promise<ApiResponse<any>>;
    markAllNotificationsRead(): Promise<ApiResponse<any>>;
    deleteNotification(id: string): Promise<ApiResponse<any>>;
    getRealtimeStreamUrl(): string;
    getAdminHealth(): Promise<ApiResponse<any>>;
    getAdminDashboard(): Promise<ApiResponse<any>>;
    getAdminAnalytics(params?: QueryParams): Promise<ApiResponse<any>>;
    updateAdminUser(id: string, payload: any): Promise<ApiResponse<any>>;
    updateAdminSeller(id: string, payload: any): Promise<ApiResponse<any>>;
    updateAdminProduct(id: string, payload: any): Promise<ApiResponse<any>>;
    updateAdminOrder(id: string, payload: any): Promise<ApiResponse<any>>;
    getAdminUsers(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getAdminUserById(id: string): Promise<ApiResponse<any>>;
    updateAdminUserStatus(id: string, status: "active" | "suspended", rationale?: string): Promise<ApiResponse<any>>;
    getAdminSellers(params?: QueryParams): Promise<ApiResponse<any[]>>;
    getAdminSellerById(id: string): Promise<ApiResponse<any>>;
    approveSeller(id: string): Promise<ApiResponse<any>>;
    rejectSeller(id: string): Promise<ApiResponse<any>>;
    suspendSeller(id: string): Promise<ApiResponse<any>>;
    reactivateSeller(id: string): Promise<ApiResponse<any>>;
    getAdminSellerDocuments(id: string): Promise<ApiResponse<any>>;
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
    getProductReviews(productId: string, params?: {
        page?: number;
        pageSize?: number;
    }): Promise<ApiResponse<ReviewListResponse>>;
    getReviewEligibility(productId: string): Promise<ApiResponse<{
        canReview: boolean;
        reason?: string;
        userReview?: ProductReview | null;
    }>>;
    submitReview(productId: string, payload: {
        rating: number;
        title?: string;
        body?: string;
    }): Promise<ApiResponse<{
        id: string;
        status: string;
        created_at: string;
    }>>;
    updateMyReview(reviewId: string, payload: {
        rating?: number;
        title?: string;
        body?: string;
    }): Promise<ApiResponse<ProductReview>>;
    markReviewHelpful(productId: string, reviewId: string): Promise<ApiResponse<{
        action: "added" | "removed";
    }>>;
    getMyReviews(params?: {
        page?: number;
    }): Promise<ApiResponse<ReviewListResponse>>;
    getSellerReviews(params?: {
        page?: number;
    }): Promise<ApiResponse<ReviewListResponse>>;
    flagReview(reviewId: string): Promise<ApiResponse<{
        flagged: boolean;
    }>>;
    adminGetReviews(params?: {
        status?: string;
        productId?: string;
        page?: number;
        pageSize?: number;
    }): Promise<ApiResponse<ReviewListResponse>>;
    adminModerateReview(reviewId: string, action: "approve" | "reject" | "hide", note?: string): Promise<ApiResponse<{
        moderated: boolean;
    }>>;
    getTrendingProducts(params?: {
        limit?: number;
    }, options?: RequestInit): Promise<ApiResponse<any[]>>;
    getRelatedProducts(slug: string, options?: RequestInit): Promise<ApiResponse<any[]>>;
    getRankedNurseries(options?: RequestInit): Promise<ApiResponse<NurserySummary[]>>;
    getAdminProductFinancialCalculation(productId: string): Promise<ApiResponse<_floria_types.AdminProductFinancialCalculation>>;
    getAdminOrderFinancialBreakdown(orderId: string): Promise<ApiResponse<_floria_types.AdminOrderFinancialBreakdown>>;
    getDeliverySettings(): Promise<ApiResponse<_floria_types.DeliverySettings>>;
    updateDeliverySettings(updates: Partial<_floria_types.DeliverySettings>): Promise<ApiResponse<_floria_types.DeliverySettings>>;
    previewDeliveryFee(subtotalPaise: number): Promise<ApiResponse<_floria_types.DeliveryCalculationResult>>;
    getFinancialSettings(): Promise<ApiResponse<_floria_types.FinancialSettings>>;
    updateFinancialSettings(updates: Partial<_floria_types.FinancialSettings>): Promise<ApiResponse<_floria_types.FinancialSettings>>;
    getPricingPolicies(): Promise<ApiResponse<{
        policies: _floria_types.PricingPolicyVersion[];
    }>>;
    getActivePricingPolicy(): Promise<ApiResponse<_floria_types.PricingPolicyVersion | null>>;
    createPricingPolicyDraft(params: {
        sellerCommissionRate: number;
        floriaProfitRate: number;
        platformMaintenanceFeePaise: number;
        freeDeliveryThresholdPaise: number;
        freeDeliveryRecoveryPaise: number;
        notes?: string;
    }): Promise<ApiResponse<_floria_types.PricingPolicyVersion>>;
    previewPricingPolicyImpact(policyId: string): Promise<ApiResponse<_floria_types.PolicyImpactPreview>>;
    startPricingRecalculation(policyId: string): Promise<ApiResponse<_floria_types.PricingRecalculationJob>>;
    getPricingRecalculationStatus(policyId: string): Promise<ApiResponse<_floria_types.PricingRecalculationJob | null>>;
    activatePricingPolicy(policyId: string): Promise<ApiResponse<_floria_types.PricingPolicyVersion>>;
    setPricingOverride(params: {
        productId: string;
        customCustomerPricePaise: number;
        reason: string;
    }): Promise<ApiResponse<_floria_types.ProductPricingOverride>>;
    removePricingOverride(productId: string): Promise<ApiResponse<{
        removed: boolean;
    }>>;
}

export { type ApiClientConfig, type ApiResponse, FloriaApiClient, type NotificationItem, type NotificationListResponse, type NurserySummary, type ProductReview, type QueryParams, type ReviewListResponse, type ReviewStatus, type ReviewSummary, type SellerDashboardData, type SellerDocument, type SellerNotificationSettings };
