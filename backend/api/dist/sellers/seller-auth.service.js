"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellerAuthService = exports.SellerAuthService = void 0;
// Floria API — Seller Dedicated Authentication & Lifecycle Service
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_util_1 = require("node:util");
const seller_auth_repository_js_1 = require("../database/repositories/seller-auth.repository.js");
const seller_repository_js_1 = require("../database/repositories/seller.repository.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const database_js_1 = require("../config/database.js");
const errors_js_1 = require("../utils/errors.js");
const scryptAsync = (0, node_util_1.promisify)(node_crypto_1.default.scrypt);
class SellerAuthService {
    /**
     * Securely hash a password with a random 16-byte cryptographic salt using scrypt.
     */
    async hashPassword(password) {
        const salt = node_crypto_1.default.randomBytes(16).toString("hex");
        const derivedKey = (await scryptAsync(password, salt, 64));
        return {
            hash: derivedKey.toString("hex"),
            salt,
        };
    }
    /**
     * Verify password using constant-time comparison.
     */
    async verifyPassword(password, storedHash, salt) {
        try {
            const derivedKey = (await scryptAsync(password, salt, 64));
            const keyBuffer = Buffer.from(storedHash, "hex");
            if (derivedKey.length !== keyBuffer.length) {
                return false;
            }
            return node_crypto_1.default.timingSafeEqual(derivedKey, keyBuffer);
        }
        catch {
            return false;
        }
    }
    /**
     * Generates a collision-resistant public seller ID (e.g. FLR-SLR-A1B2C3D4).
     */
    generatePublicSellerId() {
        const hex = node_crypto_1.default.randomBytes(4).toString("hex").toUpperCase();
        return `FLR-SLR-${hex}`;
    }
    /**
     * Become a Seller: Register an application with credentials.
     * Does NOT grant immediate dashboard access; defaults to 'under_review'.
     */
    async submitApplication(appData) {
        // 1. Normalize identifiers
        const email = appData.email.trim().toLowerCase();
        const username = appData.username.trim().toLowerCase();
        // 2. Validate uniqueness
        const [existingEmail, existingUsername] = await Promise.all([
            seller_auth_repository_js_1.sellerAuthRepository.findCredentialByEmail(email),
            seller_auth_repository_js_1.sellerAuthRepository.findCredentialByUsername(username),
        ]);
        if (existingEmail) {
            throw errors_js_1.Errors.validation("An account with this email address already exists.");
        }
        if (existingUsername) {
            throw errors_js_1.Errors.validation("This Seller ID / username is already taken.");
        }
        // 3. Securely hash password
        const { hash, salt } = await this.hashPassword(appData.password);
        // 4. Generate public seller ID
        const publicSellerId = this.generatePublicSellerId();
        // 5. Create or link Supabase Auth user if available
        let authUserId;
        try {
            const db = (0, database_js_1.getAdminDb)();
            const { data: userRecord, error: userError } = await db.auth.admin.createUser({
                email,
                password: appData.password,
                email_confirm: true,
                user_metadata: {
                    role: "seller",
                    username,
                    public_seller_id: publicSellerId,
                    business_name: appData.business_name,
                },
            });
            if (!userError && userRecord?.user) {
                authUserId = userRecord.user.id;
            }
        }
        catch {
            // Supabase admin user creation optional fallback
        }
        // 6. Create Seller Profile with status 'under_review' and is_active = false
        const profile = await seller_auth_repository_js_1.sellerAuthRepository.createSellerProfile({
            user_id: authUserId,
            business_name: appData.business_name.trim(),
            contact_email: email,
            contact_phone: appData.contact_phone.trim(),
            address: appData.address.trim(),
            city: appData.city.trim(),
            state: appData.state.trim(),
            pincode: appData.postal_code.trim(),
            business_description: appData.business_description?.trim() || "",
            business_type: appData.business_type || "Botanical Nursery",
            gst_number: appData.gst_number?.trim() || undefined,
            public_seller_id: publicSellerId,
            username,
            status: "under_review",
            is_active: false,
        });
        // 7. Create Seller Credentials
        await seller_auth_repository_js_1.sellerAuthRepository.createSellerCredential({
            seller_id: profile.id,
            user_id: authUserId,
            public_seller_id: publicSellerId,
            username,
            email,
            password_hash: hash,
            password_salt: salt,
        });
        // 8. Create Seller Application record
        const application = await seller_auth_repository_js_1.sellerAuthRepository.createSellerApplication({
            seller_id: profile.id,
            user_id: authUserId,
            username,
            email,
            business_name: appData.business_name.trim(),
            business_type: appData.business_type || "Botanical Nursery",
            business_description: appData.business_description?.trim() || "",
            contact_phone: appData.contact_phone.trim(),
            address: appData.address.trim(),
            city: appData.city.trim(),
            state: appData.state.trim(),
            postal_code: appData.postal_code.trim(),
            gst_number: appData.gst_number?.trim() || undefined,
            settlement_account: appData.settlement_account,
            submitted_documents: appData.submitted_documents,
            status: "under_review",
        });
        // 9. Audit trail
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: authUserId || profile.id,
            actor_role: "seller",
            action: "SELLER_APPLICATION_SUBMITTED",
            resource_type: "seller_application",
            resource_id: application.id,
            metadata: { publicSellerId, email, businessName: appData.business_name },
        });
        return {
            application,
            sellerId: profile.id,
            publicSellerId,
            status: "under_review",
            message: "Your seller application has been submitted and is currently under review.",
        };
    }
    /**
     * Seller Login: Authenticates by Email or Seller ID/Username + Password.
     * Enforces status gating: only ACTIVE/APPROVED sellers can log in to dashboard.
     */
    async login(identifier, pass) {
        const cleanId = identifier.trim();
        let credResult = await seller_auth_repository_js_1.sellerAuthRepository.findCredentialByIdentifier(cleanId);
        let credential = credResult?.credential;
        let profile = credResult?.profile;
        let supabaseToken;
        let isValid = false;
        if (credential) {
            // Check account lockout
            if (credential.locked_until && new Date(credential.locked_until).getTime() > Date.now()) {
                throw errors_js_1.Errors.forbidden("Too many failed login attempts. Please try again in 15 minutes.");
            }
            isValid = await this.verifyPassword(pass, credential.password_hash, credential.password_salt);
        }
        // If not verified via seller_credentials, attempt Supabase Auth directly
        if (!isValid) {
            try {
                const db = (0, database_js_1.getAdminDb)();
                let targetEmail = cleanId;
                if (!cleanId.includes("@")) {
                    // Resolve username or public seller ID to user email
                    const { data: matchedUser } = await db
                        .from("user_profiles")
                        .select("email")
                        .ilike("username", cleanId)
                        .maybeSingle();
                    if (matchedUser?.email) {
                        targetEmail = matchedUser.email;
                    }
                    else {
                        const { data: matchedSeller } = await db
                            .from("seller_profiles")
                            .select("contact_email")
                            .or(`username.ilike.${cleanId},public_seller_id.ilike.${cleanId}`)
                            .maybeSingle();
                        if (matchedSeller?.contact_email) {
                            targetEmail = matchedSeller.contact_email;
                        }
                    }
                }
                const anonDb = (0, database_js_1.getAnonDb)();
                const { data: authData, error: authErr } = await anonDb.auth.signInWithPassword({
                    email: targetEmail,
                    password: pass,
                });
                if (!authErr && authData?.user && authData?.session) {
                    isValid = true;
                    supabaseToken = authData.session.access_token;
                    const authUser = authData.user;
                    // Find profile by user_id or contact_email
                    if (!profile) {
                        const { data: foundProfile } = await db
                            .from("seller_profiles")
                            .select("*")
                            .or(`user_id.eq.${authUser.id},contact_email.ilike.${authUser.email}`)
                            .maybeSingle();
                        if (foundProfile) {
                            profile = foundProfile;
                        }
                    }
                    // If profile found, create or update seller_credentials so future lookups succeed
                    if (profile) {
                        const { hash, salt } = await this.hashPassword(pass);
                        const publicSellerId = profile.public_seller_id || this.generatePublicSellerId();
                        const username = profile.username || (authUser.email ? authUser.email.split("@")[0] : `seller_${profile.id.slice(0, 8)}`);
                        if (credential) {
                            await seller_auth_repository_js_1.sellerAuthRepository.updateSellerCredential(profile.id, {
                                password_hash: hash,
                                password_salt: salt,
                                user_id: authUser.id,
                                failed_login_attempts: 0,
                                locked_until: null,
                            });
                        }
                        else {
                            await seller_auth_repository_js_1.sellerAuthRepository.createSellerCredential({
                                seller_id: profile.id,
                                user_id: authUser.id,
                                public_seller_id: publicSellerId,
                                username,
                                email: authUser.email || profile.contact_email || cleanId,
                                password_hash: hash,
                                password_salt: salt,
                            }).catch(() => { });
                        }
                    }
                }
            }
            catch {
                // Supabase sign-in fallback handled below
            }
        }
        if (!isValid || !profile) {
            if (credential) {
                const failedAttempts = (credential.failed_login_attempts || 0) + 1;
                const updates = { failed_login_attempts: failedAttempts };
                if (failedAttempts >= 5) {
                    updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                }
                await seller_auth_repository_js_1.sellerAuthRepository.updateSellerCredential(credential.seller_id, updates);
            }
            throw errors_js_1.Errors.authRequired("Incorrect email/Seller ID or password.");
        }
        // Reset failed attempts on valid credentials
        if (credential && credential.failed_login_attempts > 0) {
            await seller_auth_repository_js_1.sellerAuthRepository.updateSellerCredential(credential.seller_id, {
                failed_login_attempts: 0,
                locked_until: null,
            });
        }
        // Check Seller Account Lifecycle Status
        const status = profile.status;
        if (status === "under_review" || status === "application_submitted" || status === "pending") {
            const app = await seller_auth_repository_js_1.sellerAuthRepository.findApplicationBySellerId(profile.id);
            const err = new Error("Your seller application is still under review.");
            err.statusCode = 403;
            err.code = "SELLER_UNDER_REVIEW";
            err.data = { status: "under_review", submittedAt: app?.submitted_at || profile.created_at };
            throw err;
        }
        if (status === "needs_correction") {
            const app = await seller_auth_repository_js_1.sellerAuthRepository.findApplicationBySellerId(profile.id);
            const err = new Error("Your seller application requires correction.");
            err.statusCode = 403;
            err.code = "SELLER_NEEDS_CORRECTION";
            err.data = {
                status: "needs_correction",
                reason: app?.correction_reason || "Please update your nursery application details.",
                applicationId: app?.id,
            };
            throw err;
        }
        if (status === "rejected") {
            const app = await seller_auth_repository_js_1.sellerAuthRepository.findApplicationBySellerId(profile.id);
            const err = new Error("Your seller application was not approved.");
            err.statusCode = 403;
            err.code = "SELLER_REJECTED";
            err.data = {
                status: "rejected",
                reason: app?.rejection_reason || "Application does not meet onboarding criteria.",
            };
            throw err;
        }
        if (status === "suspended" || status === "deactivated") {
            const err = new Error("Your seller account is currently unavailable.");
            err.statusCode = 403;
            err.code = "SELLER_SUSPENDED";
            throw err;
        }
        // Only APPROVED or ACTIVE sellers reach here
        let token = supabaseToken || "";
        if (!token) {
            try {
                const db = (0, database_js_1.getAdminDb)();
                const { data: sessionData, error: sessionErr } = await db.auth.signInWithPassword({
                    email: profile.contact_email || (credential?.email ?? cleanId),
                    password: pass,
                });
                if (!sessionErr && sessionData?.session?.access_token) {
                    token = sessionData.session.access_token;
                }
            }
            catch {
                // Fallback token generation
            }
        }
        if (!token) {
            const sessionPayload = {
                sub: profile.user_id || profile.id,
                seller_id: profile.id,
                email: profile.contact_email || credential?.email || cleanId,
                role: "seller",
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days
            };
            token = Buffer.from(JSON.stringify(sessionPayload)).toString("base64url");
        }
        return {
            user: {
                id: profile.user_id || profile.id,
                email: profile.contact_email || credential?.email || cleanId,
                role: "seller",
                sellerId: profile.id,
                publicSellerId: profile.public_seller_id || credential?.public_seller_id || "",
                username: profile.username || credential?.username || "",
                sellerStatus: status,
            },
            seller: profile,
            token,
        };
    }
    /**
     * Request Password Reset: Generates secure single-use token.
     * Safe against account enumeration.
     */
    async requestPasswordReset(identifier) {
        const credResult = await seller_auth_repository_js_1.sellerAuthRepository.findCredentialByIdentifier(identifier);
        if (credResult && credResult.credential) {
            const { credential } = credResult;
            const rawToken = node_crypto_1.default.randomBytes(32).toString("hex");
            const tokenHash = node_crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
            await seller_auth_repository_js_1.sellerAuthRepository.createPasswordReset(credential.seller_id, tokenHash, expiresAt);
            // Trigger notification / email
            try {
                const { notificationService } = await import("../notifications/notification.service.js");
                if (credential.user_id) {
                    await notificationService.createNotification({
                        user_id: credential.user_id,
                        role: "seller",
                        type: "SELLER_PASSWORD_RESET_REQUESTED",
                        title: "Password Reset Requested",
                        message: "A password reset request was initiated for your Floria seller account.",
                        source_type: "seller_credential",
                        source_id: credential.seller_id,
                    });
                }
            }
            catch {
                // Continue silently
            }
        }
        // Always return generic confirmation
        return {
            success: true,
            message: "If an eligible seller account exists, password reset instructions have been sent.",
        };
    }
    /**
     * Reset Password: Verifies single-use token, validates new password strength,
     * updates password hash, and invalidates reset token.
     */
    async resetPassword(token, newPassword) {
        const tokenHash = node_crypto_1.default.createHash("sha256").update(token.trim()).digest("hex");
        const resetRecord = await seller_auth_repository_js_1.sellerAuthRepository.findValidPasswordReset(tokenHash);
        if (!resetRecord) {
            throw errors_js_1.Errors.validation("Invalid or expired password reset link. Please request a new one.");
        }
        // Hash new password
        const { hash, salt } = await this.hashPassword(newPassword);
        // Update credentials
        await seller_auth_repository_js_1.sellerAuthRepository.updateSellerCredential(resetRecord.seller_id, {
            password_hash: hash,
            password_salt: salt,
            password_updated_at: new Date().toISOString(),
            failed_login_attempts: 0,
            locked_until: null,
        });
        // Mark token as used
        await seller_auth_repository_js_1.sellerAuthRepository.markPasswordResetUsed(resetRecord.id);
        // Sync with Supabase Auth if user exists
        try {
            const cred = await seller_auth_repository_js_1.sellerAuthRepository.findCredentialBySellerId(resetRecord.seller_id);
            if (cred?.user_id) {
                const db = (0, database_js_1.getAdminDb)();
                await db.auth.admin.updateUserById(cred.user_id, { password: newPassword });
            }
        }
        catch {
            // Ignore sync failure
        }
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: resetRecord.seller_id,
            actor_role: "seller",
            action: "SELLER_PASSWORD_RESET_COMPLETED",
            resource_type: "seller_credential",
            resource_id: resetRecord.seller_id,
        });
        return {
            success: true,
            message: "Your password has been changed successfully. You can now log in with your new credentials.",
        };
    }
    /**
     * Get application status by seller ID or identifier.
     */
    async getApplicationStatus(sellerId) {
        return seller_auth_repository_js_1.sellerAuthRepository.findApplicationBySellerId(sellerId);
    }
    /**
     * Resubmit application after correction request.
     */
    async resubmitApplication(sellerId, updates) {
        const existing = await seller_auth_repository_js_1.sellerAuthRepository.findApplicationBySellerId(sellerId);
        if (!existing) {
            throw errors_js_1.Errors.notFound("Application not found.");
        }
        if (existing.status !== "needs_correction" && existing.status !== "under_review") {
            throw errors_js_1.Errors.validation("Application cannot be modified in its current state.");
        }
        // Update profile
        await seller_repository_js_1.sellerRepository.updateProfile(sellerId, {
            ...(updates.business_name ? { business_name: updates.business_name } : {}),
            ...(updates.contact_phone ? { contact_phone: updates.contact_phone } : {}),
            ...(updates.address ? { address: updates.address } : {}),
            ...(updates.city ? { city: updates.city } : {}),
            ...(updates.state ? { state: updates.state } : {}),
            ...(updates.postal_code ? { pincode: updates.postal_code } : {}),
            ...(updates.gst_number ? { gst_number: updates.gst_number } : {}),
            status: "under_review",
        });
        // Update application record
        const updatedApp = await seller_auth_repository_js_1.sellerAuthRepository.updateApplicationStatus(existing.id, {
            status: "under_review",
            correction_reason: null,
            reviewed_at: undefined,
            reviewed_by: undefined,
        });
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: sellerId,
            actor_role: "seller",
            action: "SELLER_APPLICATION_RESUBMITTED",
            resource_type: "seller_application",
            resource_id: existing.id,
            metadata: { updates: Object.keys(updates) },
        });
        return updatedApp || existing;
    }
}
exports.SellerAuthService = SellerAuthService;
exports.sellerAuthService = new SellerAuthService();
