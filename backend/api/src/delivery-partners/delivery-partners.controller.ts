// Floria API — Delivery Partner Dedicated Controller
import { Request, Response, NextFunction } from "express";
import { deliveryPartnersService } from "./delivery-partners.service.js";
import { Errors } from "../utils/errors.js";

export class DeliveryPartnersController {
  // ── Public Onboarding ─────────────────────────────────────────────────────

  async submitApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await deliveryPartnersService.submitApplication(req.body);
      res.status(201).json({
        success: true,
        data: application,
        message: "Application submitted successfully for regional dispatch verification.",
      });
    } catch (err) {
      next(err);
    }
  }

  async getApplicationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const application = await deliveryPartnersService.getApplicationStatus(id);
      res.json({ success: true, data: application });
    } catch (err) {
      next(err);
    }
  }

  async activateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await deliveryPartnersService.activateAccount(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await deliveryPartnersService.requestPasswordReset(email);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await deliveryPartnersService.resetPassword(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // ── Courier Authenticated Actions ─────────────────────────────────────────

  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Errors.authRequired();
      const profile = await deliveryPartnersService.getMyProfile(req.user.id);
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Errors.authRequired();
      const { onDuty } = req.body;
      const profile = await deliveryPartnersService.updateAvailability(
        req.user.id,
        onDuty,
      );
      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getMyDeliveries(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Errors.authRequired();
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const deliveries = await deliveryPartnersService.getMyDeliveries(
        req.user.id,
        status,
      );
      res.json({ success: true, data: deliveries });
    } catch (err) {
      next(err);
    }
  }

  async getMyEarnings(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Errors.authRequired();
      const period = typeof req.query.period === "string" ? req.query.period : undefined;
      const earnings = await deliveryPartnersService.getMyEarnings(
        req.user.id,
        period,
      );
      res.json({ success: true, data: earnings });
    } catch (err) {
      next(err);
    }
  }

  // ── Admin Operations ──────────────────────────────────────────────────────

  async listApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const applications = await deliveryPartnersService.listApplications({
        status,
        search,
      });
      res.json({ success: true, data: applications });
    } catch (err) {
      next(err);
    }
  }

  async getApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const app = await deliveryPartnersService.getApplicationById(id);
      res.json({ success: true, data: app });
    } catch (err) {
      next(err);
    }
  }

  async approveApplication(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Errors.authRequired();
      const id = String(req.params.id);
      const result = await deliveryPartnersService.approveApplication(
        id,
        req.user.id,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async rejectApplication(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Errors.authRequired();
      const id = String(req.params.id);
      const { reason } = req.body;
      const app = await deliveryPartnersService.rejectApplication(
        id,
        reason,
        req.user.id,
      );
      res.json({ success: true, data: app });
    } catch (err) {
      next(err);
    }
  }

  async listPartners(req: Request, res: Response, next: NextFunction) {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const partners = await deliveryPartnersService.listPartners({
        status,
        search,
      });
      res.json({ success: true, data: partners });
    } catch (err) {
      next(err);
    }
  }

  async updatePartnerStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Errors.authRequired();
      const id = String(req.params.id);
      const { status } = req.body;
      const partner = await deliveryPartnersService.updatePartnerStatus(
        id,
        status,
        req.user.id,
      );
      res.json({ success: true, data: partner });
    } catch (err) {
      next(err);
    }
  }

  async listPayouts(req: Request, res: Response, next: NextFunction) {
    try {
      const partnerId = typeof req.query.partnerId === "string" ? req.query.partnerId : undefined;
      const payouts = await deliveryPartnersService.listPayouts({ partner_id: partnerId });
      res.json({ success: true, data: payouts });
    } catch (err) {
      next(err);
    }
  }

  // ── P1 Push Notifications ───────────────────────────────────────────────

  async registerDeviceToken(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Errors.authRequired();
      const { token, platform, deviceInfo } = req.body;
      if (!token) throw Errors.validation("Device token is required.");

      const { deviceTokenRepository } = await import(
        "../database/repositories/device-token.repository.js"
      );

      const registered = await deviceTokenRepository.registerToken(
        req.user.id,
        token,
        platform || "android",
        req.user.deliveryPartnerId,
        deviceInfo,
      );

      res.status(201).json({ success: true, data: registered });
    } catch (err) {
      next(err);
    }
  }

  async removeDeviceToken(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Errors.authRequired();
      const { token } = req.body;
      if (!token) throw Errors.validation("Device token is required.");

      const { deviceTokenRepository } = await import(
        "../database/repositories/device-token.repository.js"
      );

      await deviceTokenRepository.removeToken(req.user.id, token);
      res.json({ success: true, message: "Device token removed" });
    } catch (err) {
      next(err);
    }
  }

  // ── P1 Rate Cards ───────────────────────────────────────────────────────

  async getActiveRateCard(req: Request, res: Response, next: NextFunction) {
    try {
      const { deliveryRateCardService } = await import("./delivery-rate-card.service.js");
      const activeCard = await deliveryRateCardService.getActiveRateCard();
      res.json({ success: true, data: activeCard });
    } catch (err) {
      next(err);
    }
  }

  async listRateCards(req: Request, res: Response, next: NextFunction) {
    try {
      const { deliveryRateCardService } = await import("./delivery-rate-card.service.js");
      const cards = await deliveryRateCardService.listRateCards();
      res.json({ success: true, data: cards });
    } catch (err) {
      next(err);
    }
  }

  async createRateCard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Errors.authRequired();
      const { deliveryRateCardService } = await import("./delivery-rate-card.service.js");
      const card = await deliveryRateCardService.createRateCard(req.body, req.user.id);
      res.status(201).json({ success: true, data: card });
    } catch (err) {
      next(err);
    }
  }

  async updateRateCard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw Errors.authRequired();
      const id = String(req.params.id);
      const { deliveryRateCardService } = await import("./delivery-rate-card.service.js");
      const card = await deliveryRateCardService.updateRateCard(id, req.body);
      res.json({ success: true, data: card });
    } catch (err) {
      next(err);
    }
  }
}

export const deliveryPartnersController = new DeliveryPartnersController();
