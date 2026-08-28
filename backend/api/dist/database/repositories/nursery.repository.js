"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nurseryRepository = exports.NurseryRepository = void 0;
// Floria API — Nursery Repository
// Ranked nursery listing using real seller_rating_summary data.
const database_js_1 = require("../../config/database.js");
class NurseryRepository {
    async findRanked(limit = 20) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_profiles")
            .select(`id, business_name, business_description, contact_phone, contact_email,
         address, logo_url, created_at,
         rating_summary:seller_rating_summary(review_count, avg_rating, bayesian_rating, ranking_score)`)
            .eq("status", "approved")
            .eq("is_active", true)
            .limit(limit);
        if (error || !data)
            return [];
        // Sort by ranking_score DESC (sellers with no reviews sort last)
        return data.sort((a, b) => {
            const aScore = Array.isArray(a.rating_summary)
                ? (a.rating_summary[0]?.ranking_score ?? 0)
                : (a.rating_summary?.ranking_score ?? 0);
            const bScore = Array.isArray(b.rating_summary)
                ? (b.rating_summary[0]?.ranking_score ?? 0)
                : (b.rating_summary?.ranking_score ?? 0);
            return bScore - aScore;
        });
    }
}
exports.NurseryRepository = NurseryRepository;
exports.nurseryRepository = new NurseryRepository();
