"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
// Floria API — User Profile Repository
const database_js_1 = require("../../config/database.js");
class UserRepository {
    async findById(userId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("user_profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async findAll(limit = 50, offset = 0) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("user_profiles")
            .select("*")
            .range(offset, offset + limit - 1);
        if (error || !data)
            return [];
        return data;
    }
    async updateRole(userId, newRole) {
        const db = (0, database_js_1.getAdminDb)();
        const { error } = await db
            .from("user_profiles")
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq("id", userId);
        return !error;
    }
    async updateProfile(userId, updates) {
        const db = (0, database_js_1.getAdminDb)();
        const payload = { updated_at: new Date().toISOString() };
        if (updates.full_name !== undefined)
            payload.full_name = updates.full_name;
        if (updates.phone !== undefined)
            payload.phone = updates.phone;
        const { data, error } = await db
            .from("user_profiles")
            .update(payload)
            .eq("id", userId)
            .select("*")
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async deleteAccount(userId) {
        const db = (0, database_js_1.getAdminDb)();
        const { error } = await db.from("user_profiles").delete().eq("id", userId);
        return !error;
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
