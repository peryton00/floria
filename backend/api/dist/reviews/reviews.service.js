"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsService = void 0;
// Floria API — Reviews Service
// Thin orchestration: validates inputs, delegates to repository.
const review_repository_js_1 = require("../database/repositories/review.repository.js");
exports.reviewsService = {
    async getProductReviews(productId, page, pageSize) {
        const [reviewsResult, summary] = await Promise.all([
            review_repository_js_1.reviewRepository.findApprovedByProduct(productId, page, pageSize),
            review_repository_js_1.reviewRepository.getRatingSummary(productId),
        ]);
        return { ...reviewsResult, summary };
    },
    async submitReview(customerId, productId, payload) {
        if (payload.rating < 1 || payload.rating > 5) {
            const err = new Error("Rating must be between 1 and 5");
            err.status = 422;
            throw err;
        }
        const eligible = await review_repository_js_1.reviewRepository.findEligibleOrderItem(customerId, productId);
        if (!eligible) {
            const err = new Error("You can only review products you have purchased and received.");
            err.status = 403;
            err.code = "NOT_ELIGIBLE";
            throw err;
        }
        const review = await review_repository_js_1.reviewRepository.create({
            product_id: productId,
            customer_id: customerId,
            order_item_id: eligible.order_item_id,
            rating: payload.rating,
            title: payload.title?.trim() || undefined,
            body: payload.body?.trim() || undefined,
        });
        // Notify seller of new review
        try {
            const { getAdminDb } = await import("../config/database.js");
            const { notificationService } = await import("../notifications/notification.service.js");
            const db = getAdminDb();
            const { data: prod } = await db
                .from("products")
                .select("seller_id, name")
                .eq("id", productId)
                .maybeSingle();
            if (prod?.seller_id) {
                const { data: sellerProf } = await db
                    .from("seller_profiles")
                    .select("user_id")
                    .or(`id.eq.${prod.seller_id},user_id.eq.${prod.seller_id}`)
                    .maybeSingle();
                if (sellerProf?.user_id) {
                    await notificationService.createNotification({
                        user_id: sellerProf.user_id,
                        role: "seller",
                        type: "NEW_REVIEW",
                        title: "New Customer Review",
                        message: `A customer submitted a ${payload.rating}-star review on "${prod.name || "your product"}".`,
                        data: { productId, rating: payload.rating, reviewId: review.id },
                        source_type: "review",
                        source_id: review.id,
                        navigation: {
                            entityType: "REVIEW",
                            entityId: productId,
                            action: "VIEW",
                        },
                    });
                }
            }
        }
        catch (notifErr) {
            console.error("[ReviewsService] Seller review notification error:", notifErr);
        }
        return review;
    },
    async moderateReview(reviewId, action, note) {
        const result = await review_repository_js_1.reviewRepository.moderate(reviewId, action, note);
        if (!result)
            return null;
        // Refresh aggregates after status change
        await review_repository_js_1.reviewRepository.refreshRatings(result.productId, result.sellerId);
        return result;
    },
};
