"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
const database_js_1 = require("../config/database.js");
const errors_js_1 = require("../utils/errors.js");
const constants_js_1 = require("../config/constants.js");
/**
 * Extracts Bearer token, validates with Supabase Auth, resolves role & seller profile from DB.
 * Never trusts user_id, role, or seller_id from request body.
 */
async function authenticateToken(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(errors_js_1.Errors.authRequired("Missing or invalid Authorization Bearer header."));
    }
    const token = authHeader.substring(7).trim();
    if (!token) {
        return next(errors_js_1.Errors.authRequired("Empty bearer token."));
    }
    try {
        const supabase = (0, database_js_1.getAnonDb)();
        const { data: { user }, error, } = await supabase.auth.getUser(token);
        if (error || !user) {
            return next(errors_js_1.Errors.authRequired("Invalid or expired session token."));
        }
        const adminDb = (0, database_js_1.getAdminDb)();
        const { data: profile } = await adminDb
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
        const roleStr = String(profile?.role || "customer");
        const role = roleStr;
        let sellerId;
        let sellerStatus;
        if (roleStr === "seller" ||
            roleStr === "admin" ||
            roleStr === "super_admin") {
            const { data: sp } = await adminDb
                .from("seller_profiles")
                .select("id, status")
                .eq("user_id", user.id)
                .maybeSingle();
            if (sp) {
                sellerId = sp.id;
                sellerStatus = sp.status;
            }
        }
        const permissions = constants_js_1.ROLE_PERMISSIONS[role] || constants_js_1.ROLE_PERMISSIONS["customer"];
        req.user = {
            id: user.id,
            email: user.email,
            role,
            sellerId,
            sellerStatus,
            permissions,
        };
        req.token = token;
        next();
    }
    catch (err) {
        next(errors_js_1.Errors.authRequired("Authentication token verification failed."));
    }
}
/**
 * Optional authentication: attaches user if token is present, proceeds cleanly if missing.
 */
async function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }
    return authenticateToken(req, _res, next);
}
