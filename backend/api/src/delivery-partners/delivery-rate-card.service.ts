// Floria API — Delivery Rate Card Service (P1 Dynamic Delivery Compensation)
import { deliveryRateCardRepository } from "../database/repositories/delivery-rate-card.repository.js";
import { Errors } from "../utils/errors.js";
import type { DeliveryRateCard, CreateDeliveryRateCardInput, UpdateDeliveryRateCardInput } from "@floria/types";

export interface DeliveryEarningCalculation {
  base_earning_paise: number;
  extra_items_earning_paise: number;
  total_earning_paise: number;
  rate_card_id: string;
  rate_card_name: string;
  currency: string;
  calculated_at: string;
}

export class DeliveryRateCardService {
  /**
   * Evaluates the active rate card and calculates delivery earnings.
   * Server-authoritative: Client cannot supply or alter earnings.
   */
  async calculateDeliveryEarning(
    _delivery: any,
  ): Promise<DeliveryEarningCalculation> {
    const activeRateCard = await deliveryRateCardRepository.getActiveRateCard();

    // Baseline fallback if database table not yet populated (8000 paise = ₹80.00)
    const baseEarning = activeRateCard?.base_earning_paise ?? 8000;
    const rateCardId = activeRateCard?.id ?? "00000000-0000-0000-0000-000000000080";
    const rateCardName = activeRateCard?.name ?? "Standard Baseline Rate Card";
    const currency = activeRateCard?.currency ?? "INR";

    const extraItems = 0;
    const totalEarning = baseEarning + extraItems;

    return {
      base_earning_paise: baseEarning,
      extra_items_earning_paise: extraItems,
      total_earning_paise: totalEarning,
      rate_card_id: rateCardId,
      rate_card_name: rateCardName,
      currency,
      calculated_at: new Date().toISOString(),
    };
  }

  async getActiveRateCard(): Promise<DeliveryRateCard> {
    const rateCard = await deliveryRateCardRepository.getActiveRateCard();
    if (!rateCard) {
      // Return canonical baseline
      return {
        id: "00000000-0000-0000-0000-000000000080",
        name: "Standard Baseline Delivery Rate Card",
        base_earning_paise: 8000,
        currency: "INR",
        effective_from: "2026-01-01T00:00:00.000Z",
        effective_to: null,
        status: "active",
        metadata: { version: 1 },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      };
    }
    return rateCard;
  }

  async listRateCards(): Promise<DeliveryRateCard[]> {
    return deliveryRateCardRepository.listAll();
  }

  async createRateCard(
    input: CreateDeliveryRateCardInput,
    adminUserId?: string,
  ): Promise<DeliveryRateCard> {
    if (!input.name?.trim()) throw Errors.validation("Rate card name is required.");
    if (input.base_earning_paise === undefined || input.base_earning_paise < 0) {
      throw Errors.validation("Base earning must be a non-negative integer in paise.");
    }

    return deliveryRateCardRepository.createRateCard(input, adminUserId);
  }

  async updateRateCard(
    id: string,
    input: UpdateDeliveryRateCardInput,
  ): Promise<DeliveryRateCard> {
    const existing = await deliveryRateCardRepository.findById(id);
    if (!existing) throw Errors.notFound("Delivery Rate Card");

    return deliveryRateCardRepository.updateRateCard(id, input);
  }
}

export const deliveryRateCardService = new DeliveryRateCardService();
