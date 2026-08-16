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
        return review_repository_js_1.reviewRepository.create({
            product_id: productId,
            customer_id: customerId,
            order_item_id: eligible.order_item_id,
            rating: payload.rating,
            title: payload.title?.trim() || undefined,
            body: payload.body?.trim() || undefined,
        });
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
