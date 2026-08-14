"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Users & Addresses Routes
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const user_repository_js_1 = require("../database/repositories/user.repository.js");
const addresses_service_js_1 = require("./addresses.service.js");
const validation_js_1 = require("../middleware/validation.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_js_1.authenticateToken);
// User Profile
router.get("/me", async (req, res, next) => {
    try {
        const profile = await user_repository_js_1.userRepository.findById(req.user.id);
        res.json({ success: true, data: { user: req.user, profile } });
    }
    catch (err) {
        next(err);
    }
});
// Addresses
const createAddressSchema = {
    body: zod_1.z.object({
        full_name: zod_1.z.string().min(2, "Full name required"),
        phone: zod_1.z.string().min(10, "Valid phone number required"),
        line1: zod_1.z.string().min(3, "Address line 1 required"),
        line2: zod_1.z.string().optional(),
        city: zod_1.z.string().min(2, "City required"),
        state: zod_1.z.string().min(2, "State required"),
        pincode: zod_1.z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
        is_default: zod_1.z.boolean().optional(),
        label: zod_1.z.string().optional(),
    }),
};
router.get("/addresses", async (req, res, next) => {
    try {
        const addresses = await addresses_service_js_1.addressService.getAddresses(req.user.id);
        res.json({ success: true, data: addresses });
    }
    catch (err) {
        next(err);
    }
});
router.post("/addresses", (0, validation_js_1.validateRequest)(createAddressSchema), async (req, res, next) => {
    try {
        const address = await addresses_service_js_1.addressService.createAddress(req.user.id, req.body);
        res.json({ success: true, data: address });
    }
    catch (err) {
        next(err);
    }
});
router.patch("/addresses/:id/default", async (req, res, next) => {
    try {
        const addresses = await addresses_service_js_1.addressService.setDefaultAddress(req.user.id, String(req.params.id));
        res.json({ success: true, data: addresses });
    }
    catch (err) {
        next(err);
    }
});
router.delete("/addresses/:id", async (req, res, next) => {
    try {
        const addresses = await addresses_service_js_1.addressService.deleteAddress(req.user.id, String(req.params.id));
        res.json({ success: true, data: addresses });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
