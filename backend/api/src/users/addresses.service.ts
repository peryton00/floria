// Floria API — Customer Address Service
import { getAdminDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";

export interface AddressInput {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
  label?: string;
}

export class AddressService {
  async getAddresses(userId: string) {
    const db = getAdminDb();
    const { data: addresses } = await db
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return addresses || [];
  }

  async createAddress(userId: string, input: AddressInput) {
    const db = getAdminDb();

    // Ensure user_profiles row exists for foreign key constraint
    const { data: profile } = await db
      .from("user_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
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
      await db
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId);
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
      throw Errors.database("Failed to create address.");
    }

    return addr;
  }

  async updateAddress(userId: string, addressId: string, input: AddressInput) {
    const db = getAdminDb();

    const existing = await this.getAddresses(userId);
    const target = existing.find((a) => a.id === addressId);

    if (!target) throw Errors.notFound("Address");

    if (input.is_default && existing.length > 1) {
      await db
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId);
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
      throw Errors.database("Failed to update address.");
    }

    return addr;
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const db = getAdminDb();

    // Verify address exists & belongs to user
    const { data: target } = await db
      .from("addresses")
      .select("id")
      .eq("id", addressId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!target) throw Errors.notFound("Address");

    await db
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", userId);
    await db.from("addresses").update({ is_default: true }).eq("id", addressId);

    return this.getAddresses(userId);
  }

  async deleteAddress(userId: string, addressId: string) {
    const db = getAdminDb();

    const existing = await this.getAddresses(userId);
    const target = existing.find((a) => a.id === addressId);

    if (!target) throw Errors.notFound("Address");

    await db
      .from("addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", userId);

    // If deleted address was default, promote another address to default
    if (target.is_default) {
      const remaining = existing.filter((a) => a.id !== addressId);
      if (remaining.length > 0) {
        await db
          .from("addresses")
          .update({ is_default: true })
          .eq("id", remaining[0].id);
      }
    }

    return this.getAddresses(userId);
  }
}

export const addressService = new AddressService();
