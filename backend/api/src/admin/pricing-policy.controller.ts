// Floria API — Pricing Policy Administration Controller
import type { Request, Response, NextFunction } from "express";
import { policyService } from "../pricing/policy.service.js";
import { recalculationService } from "../pricing/recalculation.service.js";

export const pricingPolicyController = {
  // GET /api/v1/admin/pricing-policies
  async listPolicies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policies = await policyService.listPolicyVersions();
      res.json({ success: true, data: { policies } });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/admin/pricing-policies/active
  async getActivePolicy(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const active = await policyService.getActivePolicy();
      res.json({ success: true, data: active });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/admin/pricing-policies/:id
  async getPolicyById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const policy = await policyService.getPolicyById(id);
      res.json({ success: true, data: policy });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/v1/admin/pricing-policies
  async createDraftPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = (req as any).user?.id || "system_admin";
      const draft = await policyService.createDraftPolicy(req.body, adminUserId);
      res.status(201).json({ success: true, data: draft });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/admin/pricing-policies/:id/preview
  async previewPolicyImpact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const preview = await policyService.previewPolicyImpact(id);
      res.json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/v1/admin/pricing-policies/:id/recalculate
  async startRecalculation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const adminUserId = (req as any).user?.id || "system_admin";
      const job = await recalculationService.startRecalculationJob(id, adminUserId);
      res.status(202).json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/admin/pricing-policies/:id/recalculation-status
  async getRecalculationStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const job = await recalculationService.getLatestJobForPolicy(id);
      res.json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/v1/admin/pricing-policies/:id/activate
  async activatePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const adminUserId = (req as any).user?.id || "system_admin";
      const activated = await policyService.activatePolicy(id, adminUserId);
      res.json({ success: true, data: activated });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/v1/admin/pricing-policies/overrides
  async setProductOverride(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUserId = (req as any).user?.id || "system_admin";
      const override = await policyService.setProductOverride(req.body, adminUserId);
      res.status(201).json({ success: true, data: override });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/v1/admin/pricing-policies/overrides/:productId
  async removeProductOverride(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.params.productId as string;
      const adminUserId = (req as any).user?.id || "system_admin";
      const result = await policyService.removeProductOverride(productId, adminUserId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
