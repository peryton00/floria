"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
// Floria API — Auth Service
const user_repository_js_1 = require("../database/repositories/user.repository.js");
const errors_js_1 = require("../utils/errors.js");
class AuthService {
    async getProfile(userId) {
        const profile = await user_repository_js_1.userRepository.findById(userId);
        if (!profile)
            throw errors_js_1.Errors.notFound("User profile");
        return profile;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
