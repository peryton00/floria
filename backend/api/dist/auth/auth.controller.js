"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_service_js_1 = require("./auth.service.js");
class AuthController {
    async getMe(req, res, next) {
        try {
            const user = req.user;
            const profile = await auth_service_js_1.authService.getProfile(user.id);
            res.json({
                success: true,
                data: {
                    user: req.user,
                    profile,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
