// Floria API — Auth Controller
import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";

export class AuthController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const profile = await authService.getProfile(user.id);
      res.json({
        success: true,
        data: {
          user: req.user,
          profile,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
