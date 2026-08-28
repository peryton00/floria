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
    payload: { rating: number; title?: string; body?: string },
  ) {
    if (payload.rating < 1 || payload.rating > 5) {
      const err = new Error("Rating must be between 1 and 5") as any;
      err.status = 422;
      throw err;
    }

    const eligible = await reviewRepository.findEligibleOrderItem(
      customerId,
      productId,
    );
    if (!eligible) {
      const err = new Error(
        "You can only review products you have purchased and received.",
      ) as any;
      err.status = 403;
      err.code = "NOT_ELIGIBLE";
      throw err;
    }

    const review = await reviewRepository.create({
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
      const { notificationService } =
        await import("../notifications/notification.service.js");
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
    } catch (notifErr) {
      console.error(
        "[ReviewsService] Seller review notification error:",
        notifErr,
      );
    }

    return review;
  },

  async moderateReview(
    reviewId: string,
    action: "approve" | "reject" | "hide",
    note?: string,
  ) {
    const result = await reviewRepository.moderate(reviewId, action, note);
    if (!result) return null;
    // Refresh aggregates after status change
    await reviewRepository.refreshRatings(result.productId, result.sellerId);
    return result;
  },
};
