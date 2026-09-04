// Floria API — Delivery Rate Card Repository (P1 Dynamic Rate Card)
import { getAdminDb } from "../../config/database.js";
import type { DeliveryRateCard, CreateDeliveryRateCardInput, UpdateDeliveryRateCardInput } from "@floria/types";

export class DeliveryRateCardRepository {
  async getActiveRateCard(): Promise<DeliveryRateCard | null> {
    const db = getAdminDb();
    const now = new Date().toISOString();

    const { data, error } = await db
      .from("delivery_rate_cards")
      .select("*")
      .eq("status", "active")
      .lte("effective_from", now)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Fallback to latest active regardless of timestamp
      const { data: fallback } = await db
        .from("delivery_rate_cards")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return fallback || null;
    }

    return data;
  }

  async findById(id: string): Promise<DeliveryRateCard | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_rate_cards")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async listAll(): Promise<DeliveryRateCard[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_rate_cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return [];
    return data || [];
  }

  async createRateCard(
    input: CreateDeliveryRateCardInput,
    createdByUserId?: string,
  ): Promise<DeliveryRateCard> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_rate_cards")
      .insert({
        name: input.name,
        base_earning_paise: input.base_earning_paise,
        currency: input.currency || "INR",
        effective_from: input.effective_from || new Date().toISOString(),
        effective_to: input.effective_to || null,
        status: input.status || "active",
        metadata: input.metadata || {},
        created_by: createdByUserId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create rate card: ${error.message}`);
    }

    return data;
  }

  async updateRateCard(
    id: string,
    input: UpdateDeliveryRateCardInput,
  ): Promise<DeliveryRateCard> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("delivery_rate_cards")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Failed to update rate card: ${error?.message || "Not found"}`);
    }

    return data;
  }
}

export const deliveryRateCardRepository = new DeliveryRateCardRepository();
