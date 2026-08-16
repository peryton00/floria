// Floria API — Versioned Pricing Policy & Recalculation Engine Tests (Phase 3.23)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { policyService } from "./policy.service.js";
import { recalculationService } from "./recalculation.service.js";
import { pricingService } from "./pricing.service.js";

const mockFrom = vi.fn();

vi.mock("../config/database.js", () => {
  return {
    getAdminDb: () => ({
      from: mockFrom,
    }),
  };
});

vi.mock("../database/repositories/audit.repository.js", () => {
  return {
    auditRepository: {
      log: vi.fn().mockResolvedValue(true),
    },
  };
});

describe("Versioned Pricing Policy Engine (Phase 3.23)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Policy Creation & Validation", () => {
    it("rejects commission rate > 50%", async () => {
      await expect(
        policyService.createDraftPolicy(
          {
            sellerCommissionRate: 55,
            floriaProfitRate: 2,
            platformMaintenanceFeePaise: 1000,
            freeDeliveryThresholdPaise: 59900,
            freeDeliveryRecoveryPaise: 2000,
          },
          "admin-1"
        )
      ).rejects.toThrow("Seller commission rate must be between 0% and 50%");
    });

    it("rejects negative maintenance fee", async () => {
      await expect(
        policyService.createDraftPolicy(
          {
            sellerCommissionRate: 12,
            floriaProfitRate: 2,
            platformMaintenanceFeePaise: -500,
            freeDeliveryThresholdPaise: 59900,
            freeDeliveryRecoveryPaise: 2000,
          },
          "admin-1"
        )
      ).rejects.toThrow("Platform maintenance fee cannot be negative");
    });

    it("successfully creates draft version with incremented version number", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "pricing_policy_versions") {
          return {
            select: () => ({
              order: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: { version_number: 1 }, error: null }),
                }),
              }),
            }),
            insert: (payload: any) => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: "pol-2",
                    version_number: 2,
                    ...payload,
                    status: "draft",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      const draft = await policyService.createDraftPolicy(
        {
          sellerCommissionRate: 15,
          floriaProfitRate: 2.5,
          platformMaintenanceFeePaise: 1200,
          freeDeliveryThresholdPaise: 64900,
          freeDeliveryRecoveryPaise: 2500,
          notes: "Q4 Seasonal Policy",
        },
        "admin-1"
      );

      expect(draft.versionNumber).toBe(2);
      expect(draft.status).toBe("draft");
      expect(draft.sellerCommissionRate).toBe(15);
      expect(draft.floriaProfitRate).toBe(2.5);
    });
  });

  describe("2. Policy Impact Preview", () => {
    it("calculates accurate price changes and free delivery counts across listings", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "pricing_policy_versions") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "pol-draft",
                    version_number: 2,
                    seller_commission_rate: 12,
                    floria_profit_rate: 2,
                    platform_maintenance_fee_paise: 1000,
                    free_delivery_threshold_paise: 59900,
                    free_delivery_recovery_paise: 2000,
                    status: "draft",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "inventory") {
          return {
            select: () => ({
              gt: async () => ({
                data: [
                  { product_id: "p1", price_paise: 51000, base_price_paise: 50000 },
                  { product_id: "p2", price_paise: 63200, base_price_paise: 60000 },
                ],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const preview = await policyService.previewPolicyImpact("pol-draft");
      expect(preview.affectedListingsCount).toBe(2);
      expect(preview.freeDeliveryEligibleListingsCount).toBe(1); // p2 (60000 -> 63200)
    });
  });

  describe("3. Atomic Policy Activation", () => {
    it("archives old active policy and activates the new one", async () => {
      let oldArchived = false;
      let newActivated = false;

      mockFrom.mockImplementation((table: string) => {
        if (table === "pricing_policy_versions") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "pol-2",
                    version_number: 2,
                    seller_commission_rate: 12,
                    floria_profit_rate: 2,
                    platform_maintenance_fee_paise: 1000,
                    free_delivery_threshold_paise: 59900,
                    free_delivery_recovery_paise: 2000,
                    status: "ready",
                  },
                  error: null,
                }),
              }),
            }),
            update: (payload: any) => ({
              eq: (col: string, val: string) => {
                if (payload.status === "archived") oldArchived = true;
                if (payload.status === "active" && val === "pol-2") newActivated = true;
                return {
                  select: () => ({
                    single: async () => ({
                      data: {
                        id: "pol-2",
                        version_number: 2,
                        seller_commission_rate: 12,
                        floria_profit_rate: 2,
                        platform_maintenance_fee_paise: 1000,
                        free_delivery_threshold_paise: 59900,
                        free_delivery_recovery_paise: 2000,
                        status: "active",
                      },
                      error: null,
                    }),
                  }),
                };
              },
            }),
          };
        }
        if (table === "platform_settings") {
          return {
            upsert: async () => ({ error: null }),
          };
        }
        return {};
      });

      const activated = await policyService.activatePolicy("pol-2", "admin-1");
      expect(activated.status).toBe("active");
      expect(oldArchived).toBe(true);
      expect(newActivated).toBe(true);
    });
  });

  describe("4. Admin Product Overrides", () => {
    it("requires a non-empty reason when setting override", async () => {
      await expect(
        policyService.setProductOverride(
          {
            productId: "prod-1",
            customCustomerPricePaise: 45000,
            reason: "   ",
          },
          "admin-1"
        )
      ).rejects.toThrow("A reason is mandatory for setting a price override");
    });
  });
});
