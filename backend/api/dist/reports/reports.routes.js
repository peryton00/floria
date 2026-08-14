"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Reports Routes Placeholder (Foundation)
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const authorization_js_1 = require("../middleware/authorization.js");
const router = (0, express_1.Router)();
router.get("/", auth_js_1.authenticateToken, (0, authorization_js_1.requireRole)("admin", "super_admin"), (_req, res) => {
    res.json({ success: true, data: { status: "reports_foundation" } });
});
exports.default = router;
