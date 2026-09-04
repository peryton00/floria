// Floria API — Delivery Partner Dedicated Routes
import { Router } from "express";
import { deliveryPartnersController } from "./delivery-partners.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/authorization.js";

const router = Router();

// ── Public Onboarding & Credentials ─────────────────────────────────────────

router.post("/applications", deliveryPartnersController.submitApplication);
router.get("/applications/:id/status", deliveryPartnersController.getApplicationStatus);
router.post("/auth/activate", deliveryPartnersController.activateAccount);
router.post("/auth/forgot-password", deliveryPartnersController.forgotPassword);
router.post("/auth/reset-password", deliveryPartnersController.resetPassword);

// ── Partner Authenticated Routes ────────────────────────────────────────────

router.get(
  "/me",
  authenticateToken,
  requireRole("delivery_partner", "courier", "operations", "admin", "super_admin"),
  deliveryPartnersController.getMyProfile,
);

router.post(
  "/me/availability",
  authenticateToken,
  requireRole("delivery_partner", "courier", "operations", "admin", "super_admin"),
  deliveryPartnersController.updateAvailability,
);

router.get(
  "/my-deliveries",
  authenticateToken,
  requireRole("delivery_partner", "courier", "operations", "admin", "super_admin"),
  deliveryPartnersController.getMyDeliveries,
);

router.get(
  "/my-earnings",
  authenticateToken,
  requireRole("delivery_partner", "courier", "operations", "admin", "super_admin"),
  deliveryPartnersController.getMyEarnings,
);

// ── Admin Operations & Approvals ────────────────────────────────────────────

router.get(
  "/admin/applications",
  authenticateToken,
  requireRole("admin", "super_admin", "operations"),
  deliveryPartnersController.listApplications,
);

router.get(
  "/admin/applications/:id",
  authenticateToken,
  requireRole("admin", "super_admin", "operations"),
  deliveryPartnersController.getApplicationById,
);

router.post(
  "/admin/applications/:id/approve",
  authenticateToken,
  requireRole("admin", "super_admin"),
  deliveryPartnersController.approveApplication,
);

router.post(
  "/admin/applications/:id/reject",
  authenticateToken,
  requireRole("admin", "super_admin"),
  deliveryPartnersController.rejectApplication,
);

router.get(
  "/admin/partners",
  authenticateToken,
  requireRole("admin", "super_admin", "operations"),
  deliveryPartnersController.listPartners,
);

router.post(
  "/admin/partners/:id/status",
  authenticateToken,
  requireRole("admin", "super_admin"),
  deliveryPartnersController.updatePartnerStatus,
);

router.get(
  "/admin/payouts",
  authenticateToken,
  requireRole("admin", "super_admin", "operations"),
  deliveryPartnersController.listPayouts,
);

// ── P1 Device Tokens ────────────────────────────────────────────────────────

router.post(
  "/device-token",
  authenticateToken,
  deliveryPartnersController.registerDeviceToken,
);

router.delete(
  "/device-token",
  authenticateToken,
  deliveryPartnersController.removeDeviceToken,
);

// ── P1 Rate Cards (Couriers can view active, Admin can manage) ───────────────

router.get(
  "/rate-cards/active",
  authenticateToken,
  deliveryPartnersController.getActiveRateCard,
);

router.get(
  "/admin/rate-cards",
  authenticateToken,
  requireRole("admin", "super_admin", "operations"),
  deliveryPartnersController.listRateCards,
);

router.post(
  "/admin/rate-cards",
  authenticateToken,
  requireRole("admin", "super_admin"),
  deliveryPartnersController.createRateCard,
);

router.put(
  "/admin/rate-cards/:id",
  authenticateToken,
  requireRole("admin", "super_admin"),
  deliveryPartnersController.updateRateCard,
);

export default router;
