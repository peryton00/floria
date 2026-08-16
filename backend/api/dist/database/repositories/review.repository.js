"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRepository = exports.ReviewRepository = void 0;
// Floria API — Review Repository
// All rating mutations go through server-side DB functions — never direct client writes.
const database_js_1 = require("../../config/database.js");
class ReviewRepository {
    // ── PUBLIC: list approved reviews for a product ──────────────────────────
    async findApprovedByProduct(productId, page = 1, pageSize = 10) {
        const db = (0, database_js_1.getAdminDb)();
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, error, count } = await db
            .from("product_reviews")
            .select(`id, rating, title, body, is_verified_purchase, helpful_count,
         created_at,
         customer:user_profiles(full_name)`, { count: "exact" })
            .eq("product_id", productId)
            .eq("status", "approved")
            .order("helpful_count", { ascending: false })
            .order("created_at", { ascending: false })
            .range(from, to);
        if (error)
            return { reviews: [], total: 0 };
        return { reviews: data ?? [], total: count ?? 0 };
    }
    // ── CUSTOMER: own reviews ─────────────────────────────────────────────────
    async findByCustomer(customerId, page = 1, pageSize = 20) {
        const db = (0, database_js_1.getAdminDb)();
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        const { data, error, count } = await db
            .from("product_reviews")
            .select(`id, product_id, rating, title, body, status, helpful_count, created_at, updated_at,
         product:products(id, name, slug)`, { count: "exact" })
            .eq("customer_id", customerId)
            .order("created_at", { ascending: false })
            .range(from, to);
        if (error)
            return { reviews: [], total: 0 };
        return { reviews: data ?? [], total: count ?? 0 };
    }
    // ── VERIFIED PURCHASE CHECK ───────────────────────────────────────────────
    // Returns the order_item_id if the customer bought this product (delivered only)
    // Server derives this — client never supplies it.
    async findEligibleOrderItem(customerId, productId) {
        const db = (0, database_js_1.getAdminDb)();
        // 1. Gather all potential customer IDs (auth user ID or customer profile ID)
        const customerIds = new Set([customerId]);
        const { data: customerProf } = await db
            .from("customer_profiles")
            .select("id")
            .eq("user_id", customerId)
            .maybeSingle();
        if (customerProf?.id) {
            customerIds.add(customerProf.id);
        }
        const idsArray = Array.from(customerIds);
        // 2. Fetch all orders for this customer
        const { data: orders } = await db
            .from("orders")
            .select("id, status")
            .in("customer_id", idsArray);
        if (!orders || orders.length === 0)
            return null;
        // Filter orders where master status OR seller fulfillment status is delivered / picked_up
        const deliveredOrderIds = new Set();
        for (const o of orders) {
            const s = (o.status || "").toLowerCase();
            if (s === "delivered" ||
                s === "picked_up" ||
                s === "completed" ||
                s === "order_placed" ||
                s === "seller_pending") {
                deliveredOrderIds.add(o.id);
            }
        }
        // Also check seller_order_fulfillments for delivered items
        const { data: fulfillments } = await db
            .from("seller_order_fulfillments")
            .select("order_id, status")
            .in("order_id", orders.map((o) => o.id));
        if (fulfillments) {
            for (const f of fulfillments) {
                const s = (f.status || "").toLowerCase();
                if (s === "delivered" || s === "picked_up" || s === "completed") {
                    deliveredOrderIds.add(f.order_id);
                }
            }
        }
        if (deliveredOrderIds.size === 0)
            return null;
        // 3. Find matching order_items for this product in delivered orders
        const { data: orderItems } = await db
            .from("order_items")
            .select("id, order_id")
            .in("order_id", Array.from(deliveredOrderIds))
            .eq("product_id", productId);
        if (!orderItems || orderItems.length === 0)
            return null;
        // 4. Return the first item that doesn't already have a review
        for (const item of orderItems) {
            const { data: existing } = await db
                .from("product_reviews")
                .select("id")
                .eq("order_item_id", item.id)
                .maybeSingle();
            if (!existing) {
                return { order_item_id: item.id };
            }
        }
        return null;
    }
    // ── SUBMIT REVIEW ─────────────────────────────────────────────────────────
    async create(payload) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("product_reviews")
            .insert({
            ...payload,
            is_verified_purchase: true,
            status: "pending",
        })
            .select("id, status, created_at")
            .single();
        if (error) {
            // Unique constraint violation = duplicate
            if (error.code === "23505") {
                const err = new Error("ALREADY_REVIEWED");
                err.code = "ALREADY_REVIEWED";
                throw err;
            }
            throw error;
        }
        return data;
    }
    // ── TOGGLE HELPFUL ────────────────────────────────────────────────────────
    async toggleHelpful(reviewId, customerId) {
        const db = (0, database_js_1.getAdminDb)();
        // Check if vote exists
        const { data: existing } = await db
            .from("review_helpful_votes")
            .select("review_id")
            .eq("review_id", reviewId)
            .eq("customer_id", customerId)
            .maybeSingle();
        if (existing) {
            // Remove vote + decrement
            await db.from("review_helpful_votes")
                .delete()
                .eq("review_id", reviewId)
                .eq("customer_id", customerId);
            // Decrement via rpc if it exists, otherwise clamp at 0 via update
            const { data: rev } = await db.from("product_reviews")
                .select("helpful_count")
                .eq("id", reviewId)
                .maybeSingle();
            if (rev) {
                await db.from("product_reviews")
                    .update({ helpful_count: Math.max(0, (rev.helpful_count ?? 1) - 1) })
                    .eq("id", reviewId);
            }
            return "removed";
        }
        // Insert vote + increment
        await db.from("review_helpful_votes")
            .insert({ review_id: reviewId, customer_id: customerId });
        const { data: rev } = await db.from("product_reviews")
            .select("helpful_count")
            .eq("id", reviewId)
            .maybeSingle();
        if (rev) {
            await db.from("product_reviews")
                .update({ helpful_count: (rev.helpful_count ?? 0) + 1 })
                .eq("id", reviewId);
        }
        return "added";
    }
    // ── SELLER: flag a review for admin re-moderation ─────────────────────────
    async flagReview(reviewId, sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        // Verify review belongs to a product of this seller
        const { data: review } = await db
            .from("product_reviews")
            .select("id, product:products(seller_id)")
            .eq("id", reviewId)
            .maybeSingle();
        const productSellerId = Array.isArray(review?.product)
            ? review.product[0]?.seller_id
            : review?.product?.seller_id;
        if (!review || productSellerId !== sellerId)
            return false;
        const { error } = await db
            .from("product_reviews")
            .update({ status: "flagged" })
            .eq("id", reviewId)
            .eq("status", "approved");
        if (!error) {
            // Increment reported_count
            const { data: rev } = await db.from("product_reviews")
                .select("reported_count")
                .eq("id", reviewId)
                .maybeSingle();
            if (rev) {
                await db.from("product_reviews")
                    .update({ reported_count: (rev.reported_count ?? 0) + 1 })
                    .eq("id", reviewId);
            }
        }
        return !error;
    }
    // ── SELLER: list reviews for all seller products ──────────────────────────
    async findBySeller(sellerId, page = 1, pageSize = 20) {
        const db = (0, database_js_1.getAdminDb)();
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        // Get seller's product IDs first
        const { data: products } = await db
            .from("products")
            .select("id")
            .eq("seller_id", sellerId)
            .neq("status", "deleted");
        if (!products?.length)
            return { reviews: [], total: 0 };
        const productIds = products.map((p) => p.id);
        const { data, error, count } = await db
            .from("product_reviews")
            .select(`id, rating, title, body, status, helpful_count, seller_reply, created_at,
         customer:user_profiles(full_name),
         product:products(id, name, slug)`, { count: "exact" })
            .in("product_id", productIds)
            .in("status", ["approved", "flagged"])
            .order("created_at", { ascending: false })
            .range(from, to);
        if (error)
            return { reviews: [], total: 0 };
        return { reviews: data ?? [], total: count ?? 0 };
    }
    // ── ADMIN: list all reviews (filterable) ──────────────────────────────────
    async findAll(filters = {}) {
        const db = (0, database_js_1.getAdminDb)();
        const page = filters.page ?? 1;
        const pageSize = filters.pageSize ?? 30;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        let q = db
            .from("product_reviews")
            .select(`id, rating, title, body, status, helpful_count, reported_count,
         moderation_note, created_at, updated_at,
         customer:user_profiles(id, full_name),
         product:products(id, name, slug, seller_id)`, { count: "exact" });
        if (filters.status)
            q = q.eq("status", filters.status);
        if (filters.productId)
            q = q.eq("product_id", filters.productId);
        if (filters.customerId)
            q = q.eq("customer_id", filters.customerId);
        const { data, error, count } = await q
            .order("created_at", { ascending: false })
            .range(from, to);
        if (error)
            return { reviews: [], total: 0 };
        return { reviews: data ?? [], total: count ?? 0 };
    }
    // ── ADMIN: moderate a review ──────────────────────────────────────────────
    async moderate(reviewId, action, note) {
        const db = (0, database_js_1.getAdminDb)();
        const newStatus = action === "approve" ? "approved" : "rejected";
        const { data, error } = await db
            .from("product_reviews")
            .update({
            status: newStatus,
            moderation_note: note ?? null,
            updated_at: new Date().toISOString(),
        })
            .eq("id", reviewId)
            .select("product_id, product:products(seller_id)")
            .single();
        if (error || !data)
            return null;
        const sellerId = Array.isArray(data.product)
            ? data.product[0]?.seller_id
            : data.product?.seller_id;
        return { productId: data.product_id, sellerId };
    }
    // ── REFRESH RATING SUMMARIES (calls DB function) ─────────────────────────
    // Called server-side after any moderation action
    async refreshRatings(productId, sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        await db.rpc("refresh_product_rating_summary", { p_product_id: productId });
        if (sellerId) {
            await db.rpc("refresh_seller_rating_summary", { p_seller_id: sellerId });
        }
    }
    // ── RATING SUMMARY for a product ─────────────────────────────────────────
    async getRatingSummary(productId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data } = await db
            .from("product_rating_summary")
            .select("*")
            .eq("product_id", productId)
            .maybeSingle();
        return data ?? null;
    }
}
exports.ReviewRepository = ReviewRepository;
exports.reviewRepository = new ReviewRepository();
