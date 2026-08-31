"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellerAuthRepository = exports.SellerAuthRepository = void 0;
// Floria API — Seller Authentication & Application Repository
const database_js_1 = require("../../config/database.js");
class SellerAuthRepository {
    /**
     * Find seller credential by email, username, or public seller ID.
     */
    async findCredentialByIdentifier(identifier) {
        const db = (0, database_js_1.getAdminDb)();
        const cleanId = identifier.trim();
        const lowerId = cleanId.toLowerCase();
        const upperId = cleanId.toUpperCase();
        // Query seller_credentials matching email, username, or public_seller_id
        const { data: cred, error: credError } = await db
            .from("seller_credentials")
            .select("*")
            .or(`email.ilike.${lowerId},username.ilike.${lowerId},public_seller_id.eq.${upperId},public_seller_id.ilike.${lowerId}`)
            .maybeSingle();
        if (credError || !cred)
            return null;
        // Fetch associated seller profile
        const { data: profile } = await db
            .from("seller_profiles")
            .select("*")
            .eq("id", cred.seller_id)
            .maybeSingle();
        return {
            credential: cred,
            profile: profile || null,
        };
    }
    async findCredentialBySellerId(sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_credentials")
            .select("*")
            .eq("seller_id", sellerId)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async findCredentialByEmail(email) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_credentials")
            .select("*")
            .ilike("email", email.trim().toLowerCase())
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async findCredentialByUsername(username) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_credentials")
            .select("*")
            .ilike("username", username.trim().toLowerCase())
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async createSellerProfile(data) {
        const db = (0, database_js_1.getAdminDb)();
        const payload = {
            user_id: data.user_id || "00000000-0000-0000-0000-000000000000",
            business_name: data.business_name,
            contact_email: data.contact_email.toLowerCase(),
            contact_phone: data.contact_phone,
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            business_description: data.business_description || "",
            business_type: data.business_type || "nursery",
            gst_number: data.gst_number || null,
            public_seller_id: data.public_seller_id,
            username: data.username.toLowerCase(),
            status: data.status,
            is_active: data.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const { data: profile, error } = await db
            .from("seller_profiles")
            .insert(payload)
            .select()
            .single();
        if (error || !profile) {
            throw new Error(`Failed to create seller profile: ${error?.message || "DB error"}`);
        }
        return profile;
    }
    async createSellerCredential(data) {
        const db = (0, database_js_1.getAdminDb)();
        const payload = {
            seller_id: data.seller_id,
            user_id: data.user_id || null,
            public_seller_id: data.public_seller_id,
            username: data.username.toLowerCase(),
            email: data.email.toLowerCase(),
            password_hash: data.password_hash,
            password_salt: data.password_salt,
            password_algo: data.password_algo || "scrypt",
            failed_login_attempts: 0,
            password_updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const { data: cred, error } = await db
            .from("seller_credentials")
            .insert(payload)
            .select()
            .single();
        if (error || !cred) {
            throw new Error(`Failed to create seller credential: ${error?.message || "DB error"}`);
        }
        return cred;
    }
    async updateSellerCredential(sellerId, updates) {
        const db = (0, database_js_1.getAdminDb)();
        const { error } = await db
            .from("seller_credentials")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("seller_id", sellerId);
        return !error;
    }
    async createSellerApplication(data) {
        const db = (0, database_js_1.getAdminDb)();
        const payload = {
            seller_id: data.seller_id,
            user_id: data.user_id || null,
            username: data.username.toLowerCase(),
            email: data.email.toLowerCase(),
            business_name: data.business_name,
            business_type: data.business_type || "Botanical Nursery",
            business_description: data.business_description || "",
            contact_phone: data.contact_phone,
            address: data.address,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            gst_number: data.gst_number || null,
            settlement_account: data.settlement_account || null,
            submitted_documents: data.submitted_documents || [],
            status: data.status || "under_review",
            submitted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        const { data: app, error } = await db
            .from("seller_applications")
            .insert(payload)
            .select()
            .single();
        if (error || !app) {
            throw new Error(`Failed to create seller application: ${error?.message || "DB error"}`);
        }
        return app;
    }
    async findApplicationBySellerId(sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_applications")
            .select("*")
            .eq("seller_id", sellerId)
            .order("submitted_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async findApplicationById(id) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_applications")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async findAllApplications(status) {
        const db = (0, database_js_1.getAdminDb)();
        let query = db.from("seller_applications").select("*").order("submitted_at", { ascending: false });
        if (status && status !== "all") {
            query = query.eq("status", status);
        }
        const { data, error } = await query;
        if (error || !data)
            return [];
        return data;
    }
    async updateApplicationStatus(applicationId, updates) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_applications")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", applicationId)
            .select()
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async createPasswordReset(sellerId, tokenHash, expiresAt) {
        const db = (0, database_js_1.getAdminDb)();
        // Invalidate existing unused tokens for this seller
        await db
            .from("seller_password_resets")
            .update({ used_at: new Date().toISOString() })
            .eq("seller_id", sellerId)
            .is("used_at", null);
        const { error } = await db.from("seller_password_resets").insert({
            seller_id: sellerId,
            token_hash: tokenHash,
            expires_at: expiresAt,
            created_at: new Date().toISOString(),
        });
        return !error;
    }
    async findValidPasswordReset(tokenHash) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_password_resets")
            .select("*")
            .eq("token_hash", tokenHash)
            .is("used_at", null)
            .maybeSingle();
        if (error || !data)
            return null;
        if (new Date(data.expires_at).getTime() < Date.now()) {
            return null;
        }
        return data;
    }
    async markPasswordResetUsed(resetId) {
        const db = (0, database_js_1.getAdminDb)();
        const { error } = await db
            .from("seller_password_resets")
            .update({ used_at: new Date().toISOString() })
            .eq("id", resetId);
        return !error;
    }
}
exports.SellerAuthRepository = SellerAuthRepository;
exports.sellerAuthRepository = new SellerAuthRepository();
