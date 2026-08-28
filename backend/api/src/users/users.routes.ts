// Floria API — Users & Addresses Routes
import { Router, Request, Response, NextFunction } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { userRepository } from "../database/repositories/user.repository.js";
import { addressService } from "./addresses.service.js";
import { validateRequest } from "../middleware/validation.js";
import { z } from "zod";

const router = Router();

router.use(authenticateToken);

// User Profile
router.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userRepository.findById(req.user!.id);
    res.json({ success: true, data: { user: req.user, profile } });
  } catch (err) {
    next(err);
  }
});

router.patch("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, full_name, phone } = req.body || {};
    const updated = await userRepository.updateProfile(req.user!.id, {
      full_name: full_name || name,
      phone,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete(
  "/me",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { auditRepository } =
        await import("../database/repositories/audit.repository.js");
      await userRepository.deleteAccount(req.user!.id);
      await auditRepository.log({
        actor_user_id: req.user!.id,
        actor_role: req.user!.role as any,
        action: "USER_DELETED" as any,
        resource_type: "user_profile",
        resource_id: req.user!.id,
      });
      res.json({ success: true, message: "Account deleted successfully" });
    } catch (err) {
      next(err);
    }
  },
);

// Addresses
const createAddressSchema = {
  body: z.object({
    full_name: z.string().min(2, "Full name required"),
    phone: z.string().min(8, "Valid phone number required"),
    line1: z.string().min(3, "Address line 1 required"),
    line2: z.string().optional(),
    city: z.string().min(2, "City required"),
    state: z.string().min(2, "State required"),
    pincode: z.string().min(3, "Pincode required"),
    is_default: z.boolean().optional(),
    label: z.string().optional(),
  }),
};

router.get(
  "/addresses",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addresses = await addressService.getAddresses(req.user!.id);
      res.json({ success: true, data: addresses });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/addresses",
  validateRequest(createAddressSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const address = await addressService.createAddress(
        req.user!.id,
        req.body,
      );
      res.json({ success: true, data: address });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/addresses/:id",
  validateRequest(createAddressSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const address = await addressService.updateAddress(
        req.user!.id,
        String(req.params.id),
        req.body,
      );
      res.json({ success: true, data: address });
    } catch (err) {
      next(err);
    }
  },
);

router.patch(
  "/addresses/:id/default",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addresses = await addressService.setDefaultAddress(
        req.user!.id,
        String(req.params.id),
      );
      res.json({ success: true, data: addresses });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/addresses/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addresses = await addressService.deleteAddress(
        req.user!.id,
        String(req.params.id),
      );
      res.json({ success: true, data: addresses });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
