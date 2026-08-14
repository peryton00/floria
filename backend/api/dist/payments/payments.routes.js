"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Payments & Webhooks Routes
const express_1 = require("express");
const payments_controller_js_1 = require("./payments.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get("/", auth_js_1.authenticateToken, (_req, res) => {
    res.json({ success: true, data: { status: "foundation_ready" } });
});
router.post("/webhook", (req, res, next) => payments_controller_js_1.paymentsController.handleWebhook(req, res, next));
exports.default = router;
