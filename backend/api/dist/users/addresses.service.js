"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressService = exports.AddressService = void 0;
// Floria API — Customer Address Service
const database_js_1 = require("../config/database.js");
const errors_js_1 = require("../utils/errors.js");
class AddressService {
    async getAddresses(userId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: addresses } = await db
            .from("addresses")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        return addresses || [];
    }
    async createAddress(userId, input) {
        const db = (0, database_js_1.getAdminDb)();
        // Ensure user_profiles row exists for foreign key constraint
        const { data: profile } = await db.from("user_profiles").select("id").eq("id", userId).maybeSingle();
        if (!profile) {
            await db.from("user_profiles").insert({
                id: userId,
                role: "customer",
                full_name: input.full_name,
                phone: input.phone,
            });
        }
        // Check if user has any addresses currently
        const existing = await this.getAddresses(userId);
        const shouldBeDefault = existing.length === 0 || input.is_default === true;
        if (shouldBeDefault && existing.length > 0) {
            // Clear existing default flags
            await db.from("addresses").update({ is_default: false }).eq("user_id", userId);
        }
        const { data: addr, error } = await db
            .from("addresses")
            .insert({
            user_id: userId,
            full_name: input.full_name,
            phone: input.phone,
            line1: input.line1,
            line2: input.line2 || null,
            city: input.city,
            state: input.state,
            pincode: input.pincode,
            label: input.label || "Home",
            is_default: shouldBeDefault,
        })
            .select("*")
            .single();
        if (error || !addr) {
            console.error("[AddressService.createAddress] error:", error);
            throw errors_js_1.Errors.database("Failed to create address.");
        }
        return addr;
    }
    async updateAddress(userId, addressId, input) {
        const db = (0, database_js_1.getAdminDb)();
        const existing = await this.getAddresses(userId);
        const target = existing.find((a) => a.id === addressId);
        if (!target)
            throw errors_js_1.Errors.notFound("Address");
        if (input.is_default && existing.length > 1) {
            await db.from("addresses").update({ is_default: false }).eq("user_id", userId);
        }
        const { data: addr, error } = await db
            .from("addresses")
            .update({
            full_name: input.full_name,
            phone: input.phone,
            line1: input.line1,
            line2: input.line2 || null,
            city: input.city,
            state: input.state,
            pincode: input.pincode,
            label: input.label || target.label || "Home",
            is_default: input.is_default ?? target.is_default,
            updated_at: new Date().toISOString(),
        })
            .eq("id", addressId)
            .eq("user_id", userId)
            .select("*")
            .single();
        if (error || !addr) {
            console.error("[AddressService.updateAddress] error:", error);
            throw errors_js_1.Errors.database("Failed to update address.");
        }
        return addr;
    }
    async setDefaultAddress(userId, addressId) {
        const db = (0, database_js_1.getAdminDb)();
        // Verify address exists & belongs to user
        const { data: target } = await db
            .from("addresses")
            .select("id")
            .eq("id", addressId)
            .eq("user_id", userId)
            .maybeSingle();
        if (!target)
            throw errors_js_1.Errors.notFound("Address");
        await db.from("addresses").update({ is_default: false }).eq("user_id", userId);
        await db.from("addresses").update({ is_default: true }).eq("id", addressId);
        return this.getAddresses(userId);
    }
    async deleteAddress(userId, addressId) {
        const db = (0, database_js_1.getAdminDb)();
        const existing = await this.getAddresses(userId);
        const target = existing.find((a) => a.id === addressId);
        if (!target)
            throw errors_js_1.Errors.notFound("Address");
        await db.from("addresses").delete().eq("id", addressId).eq("user_id", userId);
        // If deleted address was default, promote another address to default
        if (target.is_default) {
            const remaining = existing.filter((a) => a.id !== addressId);
            if (remaining.length > 0) {
                await db.from("addresses").update({ is_default: true }).eq("id", remaining[0].id);
            }
        }
        return this.getAddresses(userId);
    }
}
exports.AddressService = AddressService;
exports.addressService = new AddressService();
