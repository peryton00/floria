"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pricingPolicyController = void 0;
const policy_service_js_1 = require("../pricing/policy.service.js");
const recalculation_service_js_1 = require("../pricing/recalculation.service.js");
exports.pricingPolicyController = {
    // GET /api/v1/admin/pricing-policies
    async listPolicies(_req, res, next) {
        try {
            const policies = await policy_service_js_1.policyService.listPolicyVersions();
            res.json({ success: true, data: { policies } });
        }
        catch (err) {
            next(err);
        }
    },
    // GET /api/v1/admin/pricing-policies/active
    async getActivePolicy(_req, res, next) {
        try {
            const active = await policy_service_js_1.policyService.getActivePolicy();
            res.json({ success: true, data: active });
        }
        catch (err) {
            next(err);
        }
    },
    // GET /api/v1/admin/pricing-policies/:id
    async getPolicyById(req, res, next) {
        try {
            const id = req.params.id;
            const policy = await policy_service_js_1.policyService.getPolicyById(id);
            res.json({ success: true, data: policy });
        }
        catch (err) {
            next(err);
        }
    },
    // POST /api/v1/admin/pricing-policies
    async createDraftPolicy(req, res, next) {
        try {
            const adminUserId = req.user?.id || "system_admin";
            const draft = await policy_service_js_1.policyService.createDraftPolicy(req.body, adminUserId);
            res.status(201).json({ success: true, data: draft });
        }
        catch (err) {
            next(err);
        }
    },
    // GET /api/v1/admin/pricing-policies/:id/preview
    async previewPolicyImpact(req, res, next) {
        try {
            const id = req.params.id;
            const preview = await policy_service_js_1.policyService.previewPolicyImpact(id);
            res.json({ success: true, data: preview });
        }
        catch (err) {
            next(err);
        }
    },
    // POST /api/v1/admin/pricing-policies/:id/recalculate
    async startRecalculation(req, res, next) {
        try {
            const id = req.params.id;
            const adminUserId = req.user?.id || "system_admin";
            const job = await recalculation_service_js_1.recalculationService.startRecalculationJob(id, adminUserId);
            res.status(202).json({ success: true, data: job });
        }
        catch (err) {
            next(err);
        }
    },
    // GET /api/v1/admin/pricing-policies/:id/recalculation-status
    async getRecalculationStatus(req, res, next) {
        try {
            const id = req.params.id;
            const job = await recalculation_service_js_1.recalculationService.getLatestJobForPolicy(id);
            res.json({ success: true, data: job });
        }
        catch (err) {
            next(err);
        }
    },
    // POST /api/v1/admin/pricing-policies/:id/activate
    async activatePolicy(req, res, next) {
        try {
            const id = req.params.id;
            const adminUserId = req.user?.id || "system_admin";
            const activated = await policy_service_js_1.policyService.activatePolicy(id, adminUserId);
            res.json({ success: true, data: activated });
        }
        catch (err) {
            next(err);
        }
    },
    // POST /api/v1/admin/pricing-policies/overrides
    async setProductOverride(req, res, next) {
        try {
            const adminUserId = req.user?.id || "system_admin";
            const override = await policy_service_js_1.policyService.setProductOverride(req.body, adminUserId);
            res.status(201).json({ success: true, data: override });
        }
        catch (err) {
            next(err);
        }
    },
    // DELETE /api/v1/admin/pricing-policies/overrides/:productId
    async removeProductOverride(req, res, next) {
        try {
            const productId = req.params.productId;
            const adminUserId = req.user?.id || "system_admin";
            const result = await policy_service_js_1.policyService.removeProductOverride(productId, adminUserId);
            res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    },
};
