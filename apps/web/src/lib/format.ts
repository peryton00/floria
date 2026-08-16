/** Pure formatting & financial utilities — no client/server directive, safe to import anywhere. */

export interface FinancialSettingsInput {
  sellerCommissionRate?: number;
  floriaProfitRate?: number;
  freeDeliveryThresholdPaise?: number;
  freeDeliveryRecoveryPaise?: number;
}

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format((paise || 0) / 100);
}

/**
 * Calculates final customer product price from seller base price using dynamic platform settings:
 * 1. Seller base price (paise)
 * 2. Floria profit margin (added to base price)
 * 3. Free-delivery recovery (added if pre-recovery price >= threshold)
 *
 * Parameters can be passed individually or as a FinancialSettings object fetched from platform_settings DB.
 */
export function calculateCustomerProductPricePaise(
  sellerBasePricePaise: number,
  settingsOrProfitRate?: number | FinancialSettingsInput,
  freeDeliveryThresholdPaise = 49900,
  freeDeliveryRecoveryPaise = 2000
): number {
  if (!sellerBasePricePaise || sellerBasePricePaise <= 0) return 0;

  let profitRate = 2.0;
  let threshold = freeDeliveryThresholdPaise;
  let recovery = freeDeliveryRecoveryPaise;

  if (typeof settingsOrProfitRate === "object" && settingsOrProfitRate !== null) {
    if (typeof settingsOrProfitRate.floriaProfitRate === "number") profitRate = settingsOrProfitRate.floriaProfitRate;
    if (typeof settingsOrProfitRate.freeDeliveryThresholdPaise === "number") threshold = settingsOrProfitRate.freeDeliveryThresholdPaise;
    if (typeof settingsOrProfitRate.freeDeliveryRecoveryPaise === "number") recovery = settingsOrProfitRate.freeDeliveryRecoveryPaise;
  } else if (typeof settingsOrProfitRate === "number") {
    profitRate = settingsOrProfitRate;
  }

  const profitPaise = Math.round(sellerBasePricePaise * (profitRate / 100.0));
  const preRecoveryPaise = sellerBasePricePaise + profitPaise;
  const isFreeDeliveryEligible = preRecoveryPaise >= threshold;
  const recoveryPaise = isFreeDeliveryEligible ? recovery : 0;
  return preRecoveryPaise + recoveryPaise;
}

/**
 * Calculates net seller earnings from seller base price after deducting commission cut.
 * Accepts numeric commission percentage (e.g. 15.0) or FinancialSettings object fetched from DB.
 */
export function calculateSellerNetEarningsPaise(
  sellerBasePricePaise: number,
  settingsOrCommissionRate?: number | FinancialSettingsInput
): number {
  if (!sellerBasePricePaise || sellerBasePricePaise <= 0) return 0;

  let commissionRate = 15.0;
  if (typeof settingsOrCommissionRate === "object" && settingsOrCommissionRate !== null) {
    if (typeof settingsOrCommissionRate.sellerCommissionRate === "number") {
      commissionRate = settingsOrCommissionRate.sellerCommissionRate;
    }
  } else if (typeof settingsOrCommissionRate === "number") {
    commissionRate = settingsOrCommissionRate;
  }

  const commissionPaise = Math.round(sellerBasePricePaise * (commissionRate / 100.0));
  return sellerBasePricePaise - commissionPaise;
}
