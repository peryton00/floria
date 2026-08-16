// Floria API — Reviews Service
// Thin orchestration: validates inputs, delegates to repository.
import { reviewRepository } from "../database/repositories/review.repository.js";

export const reviewsService = {
  async getProductReviews(productId: string, page: number, pageSize: number) {
    const [reviewsResult, summary] = await Promise.all([
      reviewRepository.findApprovedByProduct(productId, page, pageSize),
      reviewRepository.getRatingSummary(productId),
    ]);
    return { ...reviewsResult, summary };
  },

  async submitReview(
    customerId: string,
    productId: string,
    payload: { rating: number; title?: string; body?: string }
  ) {
    if (payload.rating < 1 || payload.rating > 5) {
      const err = new Error("Rating must be between 1 and 5") as any;
      err.status = 422;
      throw err;
    }

    const eligible = await reviewRepository.findEligibleOrderItem(customerId, productId);
    if (!eligible) {
      const err = new Error("You can only review products you have purchased and received.") as any;
      err.status = 403;
      err.code = "NOT_ELIGIBLE";
      throw err;
    }

    return reviewRepository.create({
      product_id: productId,
      customer_id: customerId,
      order_item_id: eligible.order_item_id,
      rating: payload.rating,
      title: payload.title?.trim() || undefined,
      body: payload.body?.trim() || undefined,
    });
  },

  async moderateReview(
    reviewId: string,
    action: "approve" | "reject" | "hide",
    note?: string
  ) {
    const result = await reviewRepository.moderate(reviewId, action, note);
    if (!result) return null;
    // Refresh aggregates after status change
    await reviewRepository.refreshRatings(result.productId, result.sellerId);
    return result;
  },
};
