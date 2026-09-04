// Floria API — Delivery Partner Dedicated Business Logic Service
import crypto from "node:crypto";
import { promisify } from "node:util";
import { deliveryPartnerRepository } from "../database/repositories/delivery-partner.repository.js";
import { auditRepository } from "../database/repositories/audit.repository.js";
import { getAdminDb, getAnonDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";
import type {
  DeliveryPartnerApplication,
  DeliveryPartner,
  DeliveryPartnerStatus,
  SubmitDeliveryApplicationInput,
  ActivateDeliveryPartnerInput,
  DeliveryEarning,
  DeliveryPayout,
} from "@floria/types";

const scryptAsync = promisify(crypto.scrypt);

export class DeliveryPartnersService {
  /**
   * Securely hash a password with a random 16-byte salt using scrypt.
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
  async verifyPassword(
    password: string,
    storedHash: string,
    salt: string,
  ): Promise<boolean> {
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
   * Generates a collision-resistant public courier ID (e.g. FLR-DRV-A1B2C3D4).
   */
  generatePublicCourierId(): string {
    const hex = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `FLR-DRV-${hex}`;
  }

  // ── Onboarding ────────────────────────────────────────────────────────────

  async submitApplication(
    input: SubmitDeliveryApplicationInput,
  ): Promise<DeliveryPartnerApplication> {
    // 1. Validation
    if (!input.full_name?.trim()) throw Errors.validation("Full name is required.");
    if (!input.email?.trim() || !input.email.includes("@"))
      throw Errors.validation("A valid email address is required.");
    if (!input.phone?.trim() || input.phone.trim().length < 10)
      throw Errors.validation("A valid 10-digit mobile number is required.");
    if (!input.vehicle_number?.trim())
      throw Errors.validation("Vehicle registration number (RC) is required.");
    if (!input.driving_license?.trim())
      throw Errors.validation("Driving license number is required.");

    const email = input.email.toLowerCase().trim();

    // 2. Prevent duplicate pending applications
    const existing = await deliveryPartnerRepository.findApplicationByEmail(email);
    if (existing && existing.status === "pending") {
      throw Errors.conflict(
        "An active application for this email address is already under review.",
      );
    }

    const application = await deliveryPartnerRepository.createApplication({
      full_name: input.full_name.trim(),
      email,
      phone: input.phone.trim(),
      city: input.city?.trim() || "Bangalore",
      vehicle_type: input.vehicle_type || "two_wheeler",
      vehicle_number: input.vehicle_number.toUpperCase().trim(),
      driving_license: input.driving_license.toUpperCase().trim(),
    });

    // 3. Audit Log
    await auditRepository.log({
      actor_user_id: application.id,
      actor_role: "delivery_partner",
      action: "DELIVERY_PARTNER_APPLICATION_SUBMITTED",
      resource_type: "delivery_partner_application",
      resource_id: application.id,
      metadata: {
        email: application.email,
        city: application.city,
        vehicle_type: application.vehicle_type,
      },
    });

    // 4. Notification to Admin / Operations
    try {
      const { notificationService } = await import(
        "../notifications/notification.service.js"
      );
      await notificationService.createNotification({
        user_id: application.id,
        role: "admin",
        type: "DELIVERY_PARTNER_APPLICATION_SUBMITTED",
        title: "New Delivery Partner Application",
        message: `New driver application received from ${application.full_name} (${application.city}).`,
        source_type: "delivery_partner_application",
        source_id: application.id,
      });
    } catch {
      // Continue silently
    }

    return application;
  }

  async getApplicationStatus(id: string): Promise<DeliveryPartnerApplication> {
    const app = await deliveryPartnerRepository.findApplicationById(id);
    if (!app) throw Errors.notFound("Delivery Partner Application");
    return app;
  }

  // ── Account Provisioning & Activation ──────────────────────────────────────

  async activateAccount(
    input: ActivateDeliveryPartnerInput,
  ): Promise<{ success: boolean; message: string }> {
    if (!input.token?.trim()) throw Errors.validation("Activation token is required.");
    if (!input.password || input.password.length < 8)
      throw Errors.validation("Password must be at least 8 characters.");

    const tokenHash = crypto
      .createHash("sha256")
      .update(input.token.trim())
      .digest("hex");

    const cred = await deliveryPartnerRepository.findCredentialByTokenHash(tokenHash);
    if (!cred) {
      throw Errors.validation("Invalid or expired activation link.");
    }

    if (cred.is_activated) {
      throw Errors.conflict("This account has already been activated. Please log in.");
    }

    if (cred.activation_expires_at && new Date(cred.activation_expires_at) < new Date()) {
      throw Errors.validation("Activation link has expired. Please contact dispatch support.");
    }

    const { hash, salt } = await this.hashPassword(input.password);
    const adminDb = getAdminDb();

    // 1. Create or link Supabase auth user
    let authUserId = cred.user_id;
    if (!authUserId) {
      try {
        const { data: authUser, error: authErr } =
          await adminDb.auth.admin.createUser({
            email: cred.email,
            password: input.password,
            email_confirm: true,
            user_metadata: {
              role: "delivery_partner",
              public_partner_id: cred.public_partner_id,
            },
          });

        if (!authErr && authUser?.user) {
          authUserId = authUser.user.id;
        }
      } catch {
        // Fallback if auth user already exists
      }
    } else {
      // Update existing auth user password
      try {
        await adminDb.auth.admin.updateUserById(authUserId, {
          password: input.password,
          email_confirm: true,
        });
      } catch {
        // Continue
      }
    }

    // 2. Ensure user_profiles has role = 'delivery_partner'
    if (authUserId) {
      await adminDb.from("user_profiles").upsert(
        {
          id: authUserId,
          role: "delivery_partner",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      // Link partner record to user_id
      await deliveryPartnerRepository.updatePartner(cred.partner_id, {
        user_id: authUserId,
      });
    }

    // 3. Mark credentials activated
    await deliveryPartnerRepository.updateCredential(cred.partner_id, {
      user_id: authUserId,
      password_hash: hash,
      password_salt: salt,
      is_activated: true,
      activation_token_hash: null,
      activation_expires_at: null,
    });

    // 4. Audit Log
    await auditRepository.log({
      actor_user_id: authUserId || cred.partner_id,
      actor_role: "delivery_partner",
      action: "DELIVERY_PARTNER_ACTIVATED",
      resource_type: "delivery_partner",
      resource_id: cred.partner_id,
      metadata: { email: cred.email },
    });

    return {
      success: true,
      message: "Your courier account has been successfully activated. You can now sign in.",
    };
  }

  async requestPasswordReset(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const partner = await deliveryPartnerRepository.findPartnerByEmail(cleanEmail);

    if (partner) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      await deliveryPartnerRepository.createPasswordReset(
        partner.id,
        tokenHash,
        expiresAt,
      );

      // Dispatch notification
      try {
        const { notificationService } = await import(
          "../notifications/notification.service.js"
        );
        if (partner.user_id) {
          await notificationService.createNotification({
            user_id: partner.user_id,
            role: "customer",
            type: "DELIVERY_PARTNER_PASSWORD_RESET",
            title: "Password Reset Requested",
            message: "A password reset link has been generated for your courier account.",
            source_type: "delivery_partner",
            source_id: partner.id,
          });
        }
      } catch {
        // Continue silently
      }
    }

    // Always return success to prevent email enumeration
    return {
      success: true,
      message: "If an active courier account exists for this email, password reset instructions have been sent.",
    };
  }

  async resetPassword(
    input: ActivateDeliveryPartnerInput,
  ): Promise<{ success: boolean; message: string }> {
    if (!input.token?.trim()) throw Errors.validation("Reset token is required.");
    if (!input.password || input.password.length < 8)
      throw Errors.validation("Password must be at least 8 characters.");

    const tokenHash = crypto
      .createHash("sha256")
      .update(input.token.trim())
      .digest("hex");

    const resetRecord =
      await deliveryPartnerRepository.findPasswordResetByTokenHash(tokenHash);
    if (!resetRecord) {
      throw Errors.validation("Invalid or expired password reset link.");
    }

    const { hash, salt } = await this.hashPassword(input.password);
    const partner = await deliveryPartnerRepository.findPartnerById(
      resetRecord.partner_id,
    );

    if (!partner) throw Errors.notFound("Courier Profile");

    // Update credential
    await deliveryPartnerRepository.updateCredential(partner.id, {
      password_hash: hash,
      password_salt: salt,
    });

    // Update Supabase Auth password if user_id exists
    if (partner.user_id) {
      try {
        const adminDb = getAdminDb();
        await adminDb.auth.admin.updateUserById(partner.user_id, {
          password: input.password,
        });
      } catch {
        // Fallback
      }
    }

    // Mark reset used
    await deliveryPartnerRepository.markPasswordResetUsed(resetRecord.id);

    // Audit Log
    await auditRepository.log({
      actor_user_id: partner.user_id || partner.id,
      actor_role: "delivery_partner",
      action: "DELIVERY_PARTNER_PASSWORD_RESET",
      resource_type: "delivery_partner",
      resource_id: partner.id,
      metadata: { email: partner.email },
    });

    return {
      success: true,
      message: "Your courier password has been successfully updated. You can now sign in.",
    };
  }

  // ── Driver Portal (Strict Courier Isolation) ──────────────────────────────

  async getMyProfile(userId: string): Promise<DeliveryPartner> {
    let partner = await deliveryPartnerRepository.findPartnerByUserId(userId);
    if (!partner) {
      partner = await deliveryPartnerRepository.findPartnerById(userId);
    }
    if (!partner) throw Errors.notFound("Delivery Partner Profile");
    return partner;
  }

  async updateAvailability(
    userId: string,
    onDuty: boolean,
  ): Promise<DeliveryPartner> {
    const partner = await this.getMyProfile(userId);
    const updated = await deliveryPartnerRepository.updatePartner(partner.id, {
      on_duty: Boolean(onDuty),
    });

    if (!updated) throw Errors.database("Failed to update availability status");

    await auditRepository.log({
      actor_user_id: userId,
      actor_role: "delivery_partner",
      action: "DELIVERY_PARTNER_DUTY_CHANGED",
      resource_type: "delivery_partner",
      resource_id: partner.id,
      metadata: { onDuty: Boolean(onDuty) },
    });

    return updated;
  }

  async getMyDeliveries(userId: string, status?: string): Promise<any[]> {
    const partner = await this.getMyProfile(userId);
    return deliveryPartnerRepository.findPartnerDeliveries(partner.id, status);
  }

  async getMyEarnings(
    userId: string,
    period?: string,
  ): Promise<{
    today: number;
    week: number;
    month: number;
    completedCount: number;
    earnings: DeliveryEarning[];
  }> {
    const partner = await this.getMyProfile(userId);
    const earnings = await deliveryPartnerRepository.findEarningsByPartnerId(
      partner.id,
    );

    const now = new Date();
    const isToday = (dStr: string) => {
      const d = new Date(dStr);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    };

    const isThisWeek = (dStr: string) => {
      const d = new Date(dStr);
      const diffDays = Math.ceil(
        Math.abs(now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays <= 7;
    };

    const isThisMonth = (dStr: string) => {
      const d = new Date(dStr);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    };

    let today = 0;
    let week = 0;
    let month = 0;

    for (const e of earnings) {
      const val = e.total_earning_paise / 100; // in INR
      if (isToday(e.created_at)) today += val;
      if (isThisWeek(e.created_at)) week += val;
      if (isThisMonth(e.created_at)) month += val;
    }

    return {
      today,
      week,
      month,
      completedCount: earnings.length,
      earnings,
    };
  }

  // ── Admin Operations ──────────────────────────────────────────────────────

  async listApplications(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<DeliveryPartnerApplication[]> {
    return deliveryPartnerRepository.findApplications(filters);
  }

  async getApplicationById(id: string): Promise<DeliveryPartnerApplication> {
    const app = await deliveryPartnerRepository.findApplicationById(id);
    if (!app) throw Errors.notFound("Delivery Partner Application");
    return app;
  }

  async approveApplication(
    id: string,
    adminUserId: string,
  ): Promise<{
    application: DeliveryPartnerApplication;
    partner: DeliveryPartner;
    activationToken: string;
  }> {
    const app = await deliveryPartnerRepository.findApplicationById(id);
    if (!app) throw Errors.notFound("Delivery Partner Application");
    if (app.status === "approved") {
      throw Errors.conflict("This application has already been approved.");
    }

    const publicPartnerId = this.generatePublicCourierId();
    const rawActivationToken = crypto.randomBytes(32).toString("hex");
    const activationTokenHash = crypto
      .createHash("sha256")
      .update(rawActivationToken)
      .digest("hex");
    const activationExpiresAt = new Date(
      Date.now() + 48 * 60 * 60 * 1000,
    ).toISOString(); // 48 hours

    // 1. Create delivery partner profile
    const partner = await deliveryPartnerRepository.createPartner({
      public_partner_id: publicPartnerId,
      full_name: app.full_name,
      email: app.email,
      phone: app.phone,
      city: app.city,
      vehicle_type: app.vehicle_type,
      vehicle_number: app.vehicle_number,
      driving_license: app.driving_license,
      status: "active",
    });

    // 2. Create credential record with activation token
    await deliveryPartnerRepository.createCredential({
      partner_id: partner.id,
      email: partner.email,
      public_partner_id: publicPartnerId,
      activation_token_hash: activationTokenHash,
      activation_expires_at: activationExpiresAt,
      is_activated: false,
    });

    // 3. Update application status
    const updatedApp = await deliveryPartnerRepository.updateApplication(id, {
      status: "approved",
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
    });

    // 4. Audit Log
    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "DELIVERY_PARTNER_APPROVED",
      resource_type: "delivery_partner",
      resource_id: partner.id,
      metadata: {
        applicationId: id,
        partnerId: partner.id,
        publicPartnerId,
      },
    });

    // 5. Dispatch notification
    try {
      const { notificationService } = await import(
        "../notifications/notification.service.js"
      );
      await notificationService.createNotification({
        user_id: partner.id,
        role: "admin",
        type: "DELIVERY_PARTNER_APPROVED",
        title: "Courier Application Approved",
        message: `Courier ${partner.full_name} (${publicPartnerId}) approved by admin.`,
        source_type: "delivery_partner",
        source_id: partner.id,
      });
    } catch {
      // Continue silently
    }

    return {
      application: updatedApp || app,
      partner,
      activationToken: rawActivationToken,
    };
  }

  async rejectApplication(
    id: string,
    reason: string,
    adminUserId: string,
  ): Promise<DeliveryPartnerApplication> {
    const app = await deliveryPartnerRepository.findApplicationById(id);
    if (!app) throw Errors.notFound("Delivery Partner Application");

    const updated = await deliveryPartnerRepository.updateApplication(id, {
      status: "rejected",
      rejection_reason: reason || "Application did not satisfy onboarding criteria.",
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
    });

    if (!updated) throw Errors.database("Failed to reject application");

    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "DELIVERY_PARTNER_REJECTED",
      resource_type: "delivery_partner_application",
      resource_id: id,
      metadata: { reason },
    });

    return updated;
  }

  async listPartners(filters?: {
    status?: string;
    on_duty?: boolean;
    search?: string;
  }): Promise<DeliveryPartner[]> {
    return deliveryPartnerRepository.findPartners(filters);
  }

  async updatePartnerStatus(
    id: string,
    status: DeliveryPartnerStatus,
    adminUserId: string,
  ): Promise<DeliveryPartner> {
    const partner = await deliveryPartnerRepository.findPartnerById(id);
    if (!partner) throw Errors.notFound("Delivery Partner");

    const updated = await deliveryPartnerRepository.updatePartner(id, { status });
    if (!updated) throw Errors.database("Failed to update partner status");

    await auditRepository.log({
      actor_user_id: adminUserId,
      actor_role: "admin",
      action: "DELIVERY_PARTNER_STATUS_CHANGED",
      resource_type: "delivery_partner",
      resource_id: id,
      metadata: { from: partner.status, to: status },
    });

    return updated;
  }

  async listPayouts(filters?: { partner_id?: string }): Promise<DeliveryPayout[]> {
    return deliveryPartnerRepository.findPayouts(filters);
  }
}

export const deliveryPartnersService = new DeliveryPartnersService();
