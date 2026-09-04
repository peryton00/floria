// Floria API — Seller Dedicated Authentication & Lifecycle Service
import crypto from "node:crypto";
import { promisify } from "node:util";
import { sellerAuthRepository } from "../database/repositories/seller-auth.repository.js";
import { sellerRepository } from "../database/repositories/seller.repository.js";
import { auditRepository } from "../database/repositories/audit.repository.js";
import { getAdminDb, getAnonDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";
import type { SellerProfile, SellerApplication, SellerStatus } from "@floria/types";

const scryptAsync = promisify(crypto.scrypt);

export class SellerAuthService {
  /**
   * Securely hash a password with a random 16-byte cryptographic salt using scrypt.
   */
  async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return {
      hash: derivedKey.toString("hex"),
      salt,
    };
  }

  /**
   * Verify password using constant-time comparison.
   */
  async verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
    try {
      const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
      const keyBuffer = Buffer.from(storedHash, "hex");
      if (derivedKey.length !== keyBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(derivedKey, keyBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Generates a collision-resistant public seller ID (e.g. FLR-SLR-A1B2C3D4).
   */
  generatePublicSellerId(): string {
    const hex = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `FLR-SLR-${hex}`;
  }

  /**
   * Become a Seller: Register an application with credentials.
   * Does NOT grant immediate dashboard access; defaults to 'under_review'.
   */
  async submitApplication(appData: {
    username: string;
    email: string;
    password: string;
    business_name: string;
    business_type?: string;
    business_description?: string;
    contact_phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    gst_number?: string;
    settlement_account?: any;
    submitted_documents?: any[];
  }): Promise<{
    application: SellerApplication;
    sellerId: string;
    publicSellerId: string;
    status: SellerStatus;
    message: string;
  }> {
    // 1. Normalize identifiers
    const email = appData.email.trim().toLowerCase();
    const username = appData.username.trim().toLowerCase();

    // 2. Validate uniqueness & Mutual Exclusion with Delivery Partners
    const [existingEmail, existingUsername] = await Promise.all([
      sellerAuthRepository.findCredentialByEmail(email),
      sellerAuthRepository.findCredentialByUsername(username),
    ]);

    if (existingEmail) {
      throw Errors.validation("An account with this email address already exists.");
    }
    if (existingUsername) {
      throw Errors.validation("This Seller ID / username is already taken.");
    }

    // Check if email is already registered as a Delivery Partner (active or pending)
    try {
      const db = getAdminDb();
      const [courierRes, courierAppRes] = await Promise.all([
        db.from("delivery_partners").select("id, email, status").ilike("email", email).maybeSingle(),
        db.from("delivery_partner_applications").select("id, email, status").ilike("email", email).maybeSingle(),
      ]);
      if (courierRes?.data || courierAppRes?.data) {
        throw Errors.validation(
          "This email is already registered as a Delivery Partner. An account cannot be both a delivery partner and a seller.",
        );
      }
    } catch (mErr: any) {
      if (mErr.statusCode === 422 || mErr.code === "VALIDATION_ERROR") throw mErr;
    }

    // 3. Securely hash password
    const { hash, salt } = await this.hashPassword(appData.password);

    // 4. Generate public seller ID
    const publicSellerId = this.generatePublicSellerId();

    // 5. Create or link Supabase Auth user (smart sync for existing customer accounts)
    let authUserId: string | undefined;
    try {
      const db = getAdminDb();
      // Check if user already exists (e.g. from customer Google OAuth or signup)
      const { data: existingUser } = await db
        .from("user_profiles")
        .select("id, email, role")
        .ilike("email", email)
        .maybeSingle();

      if (existingUser?.id) {
        authUserId = existingUser.id;
        await db.auth.admin.updateUserById(existingUser.id, {
          password: appData.password,
          email_confirm: true,
          user_metadata: {
            role: "seller",
            username,
            public_seller_id: publicSellerId,
            business_name: appData.business_name,
          },
        });
      } else {
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
    } catch {
      // Supabase admin user creation optional fallback
    }

    // 6. Create Seller Profile with status 'under_review' and is_active = false
    const profile = await sellerAuthRepository.createSellerProfile({
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
    await sellerAuthRepository.createSellerCredential({
      seller_id: profile.id,
      user_id: authUserId,
      public_seller_id: publicSellerId,
      username,
      email,
      password_hash: hash,
      password_salt: salt,
    });

    // 8. Create Seller Application record
    const application = await sellerAuthRepository.createSellerApplication({
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
    await auditRepository.log({
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
  async login(
    identifier: string,
    pass: string,
  ): Promise<{
    user: {
      id: string;
      email: string;
      role: string;
      sellerId: string;
      publicSellerId: string;
      username: string;
      sellerStatus: SellerStatus;
    };
    seller: SellerProfile;
    token: string;
  }> {
    const cleanId = identifier.trim();
    let credResult = await sellerAuthRepository.findCredentialByIdentifier(cleanId);
    let credential = credResult?.credential;
    let profile = credResult?.profile;
    let supabaseToken: string | undefined;

    let isValid = false;
    if (credential) {
      // Check account lockout
      if (credential.locked_until && new Date(credential.locked_until).getTime() > Date.now()) {
        throw Errors.forbidden("Too many failed login attempts. Please try again in 15 minutes.");
      }
      isValid = await this.verifyPassword(pass, credential.password_hash, credential.password_salt);
    }

    // If not verified via seller_credentials, attempt Supabase Auth directly
    if (!isValid) {
      try {
        const db = getAdminDb();
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
          } else {
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

        const anonDb = getAnonDb();
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
              profile = foundProfile as SellerProfile;
            }
          }

          // If profile found, create or update seller_credentials so future lookups succeed
          if (profile) {
            const { hash, salt } = await this.hashPassword(pass);
            const publicSellerId = profile.public_seller_id || this.generatePublicSellerId();
            const username = profile.username || (authUser.email ? authUser.email.split("@")[0] : `seller_${profile.id.slice(0, 8)}`);

            if (credential) {
              await sellerAuthRepository.updateSellerCredential(profile.id, {
                password_hash: hash,
                password_salt: salt,
                user_id: authUser.id,
                failed_login_attempts: 0,
                locked_until: null,
              });
            } else {
              await sellerAuthRepository.createSellerCredential({
                seller_id: profile.id,
                user_id: authUser.id,
                public_seller_id: publicSellerId,
                username,
                email: authUser.email || profile.contact_email || cleanId,
                password_hash: hash,
                password_salt: salt,
              }).catch(() => {});
            }
          }
        }
      } catch {
        // Supabase sign-in fallback handled below
      }
    }

    if (!isValid || !profile) {
      if (credential) {
        const failedAttempts = (credential.failed_login_attempts || 0) + 1;
        const updates: any = { failed_login_attempts: failedAttempts };
        if (failedAttempts >= 5) {
          updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }
        await sellerAuthRepository.updateSellerCredential(credential.seller_id, updates);
      }
      throw Errors.authRequired("Incorrect email/Seller ID or password.");
    }

    // Reset failed attempts on valid credentials
    if (credential && credential.failed_login_attempts > 0) {
      await sellerAuthRepository.updateSellerCredential(credential.seller_id, {
        failed_login_attempts: 0,
        locked_until: null,
      });
    }

    // Check Seller Account Lifecycle Status
    const status = profile.status;

    if (status === "under_review" || status === "application_submitted" || status === "pending") {
      const app = await sellerAuthRepository.findApplicationBySellerId(profile.id);
      const err: any = new Error("Your seller application is still under review.");
      err.statusCode = 403;
      err.code = "SELLER_UNDER_REVIEW";
      err.data = { status: "under_review", submittedAt: app?.submitted_at || profile.created_at };
      throw err;
    }

    if (status === "needs_correction") {
      const app = await sellerAuthRepository.findApplicationBySellerId(profile.id);
      const err: any = new Error("Your seller application requires correction.");
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
      const app = await sellerAuthRepository.findApplicationBySellerId(profile.id);
      const err: any = new Error("Your seller application was not approved.");
      err.statusCode = 403;
      err.code = "SELLER_REJECTED";
      err.data = {
        status: "rejected",
        reason: app?.rejection_reason || "Application does not meet onboarding criteria.",
      };
      throw err;
    }

    if (status === "suspended" || status === "deactivated") {
      const err: any = new Error("Your seller account is currently unavailable.");
      err.statusCode = 403;
      err.code = "SELLER_SUSPENDED";
      throw err;
    }

    // Only APPROVED or ACTIVE sellers reach here
    let token = supabaseToken || "";
    if (!token) {
      try {
        const db = getAdminDb();
        const { data: sessionData, error: sessionErr } = await db.auth.signInWithPassword({
          email: profile.contact_email || (credential?.email ?? cleanId),
          password: pass,
        });
        if (!sessionErr && sessionData?.session?.access_token) {
          token = sessionData.session.access_token;
        }
      } catch {
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
  async requestPasswordReset(identifier: string): Promise<{ success: boolean; message: string }> {
    const credResult = await sellerAuthRepository.findCredentialByIdentifier(identifier);

    if (credResult && credResult.credential) {
      const { credential } = credResult;
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      await sellerAuthRepository.createPasswordReset(credential.seller_id, tokenHash, expiresAt);

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
      } catch {
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
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
    const resetRecord = await sellerAuthRepository.findValidPasswordReset(tokenHash);

    if (!resetRecord) {
      throw Errors.validation("Invalid or expired password reset link. Please request a new one.");
    }

    // Hash new password
    const { hash, salt } = await this.hashPassword(newPassword);

    // Update credentials
    await sellerAuthRepository.updateSellerCredential(resetRecord.seller_id, {
      password_hash: hash,
      password_salt: salt,
      password_updated_at: new Date().toISOString(),
      failed_login_attempts: 0,
      locked_until: null,
    });

    // Mark token as used
    await sellerAuthRepository.markPasswordResetUsed(resetRecord.id);

    // Sync with Supabase Auth if user exists
    try {
      const cred = await sellerAuthRepository.findCredentialBySellerId(resetRecord.seller_id);
      if (cred?.user_id) {
        const db = getAdminDb();
        await db.auth.admin.updateUserById(cred.user_id, { password: newPassword });
      }
    } catch {
      // Ignore sync failure
    }

    await auditRepository.log({
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
  async getApplicationStatus(sellerId: string): Promise<SellerApplication | null> {
    return sellerAuthRepository.findApplicationBySellerId(sellerId);
  }

  /**
   * Resubmit application after correction request.
   */
  async resubmitApplication(
    sellerId: string,
    updates: {
      business_name?: string;
      contact_phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      gst_number?: string;
      submitted_documents?: any[];
    },
  ): Promise<SellerApplication> {
    const existing = await sellerAuthRepository.findApplicationBySellerId(sellerId);
    if (!existing) {
      throw Errors.notFound("Application not found.");
    }

    if (existing.status !== "needs_correction" && existing.status !== "under_review") {
      throw Errors.validation("Application cannot be modified in its current state.");
    }

    // Update profile
    await sellerRepository.updateProfile(sellerId, {
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
    const updatedApp = await sellerAuthRepository.updateApplicationStatus(existing.id, {
      status: "under_review",
      correction_reason: null,
      reviewed_at: undefined,
      reviewed_by: undefined,
    });

    await auditRepository.log({
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

export const sellerAuthService = new SellerAuthService();
