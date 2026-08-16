// Floria API — Admin Financial Calculation & Breakdown Service
import { getAdminDb } from "../config/database.js";
import { settingsRepository } from "../database/repositories/settings.repository.js";
import { Errors } from "../utils/errors.js";
import type {
  AdminProductFinancialCalculation,
  AdminOrderFinancialBreakdown,
  NurseryOrderFinancialAttribution,
} from "@floria/types";

export class AdminFinancialService {
  async getProductFinancialCalculation(productId: string): Promise<AdminProductFinancialCalculation> {
    const db = getAdminDb();

    // 1. Fetch Product, Inventory & Seller Info
    const { data: prod } = await db
      .from("products")
      .select("id, name, seller_id, seller:seller_profiles(id, business_name)")
      .eq("id", productId)
      .maybeSingle();

    if (!prod) throw Errors.notFound("Product");

    const { data: inv } = await db
      .from("inventory")
      .select("base_price_paise, price_paise, sku")
      .eq("product_id", productId)
      .maybeSingle();

    const rawBase = inv?.base_price_paise ?? inv?.price_paise ?? 0;
    const sellerObj = Array.isArray(prod.seller) ? prod.seller[0] : prod.seller;

    // 2. Perform Unified Pricing Engine Calculation
    const { pricingService } = await import("../pricing/pricing.service.js");
    const calc = await pricingService.calculateProductPricing(rawBase);

    return {
      product: {
        id: prod.id,
        name: prod.name,
        sellerId: prod.seller_id,
        sellerName: sellerObj?.business_name || "Partner Nursery",
      },
      pricing: {
        sellerBasePricePaise: calc.sellerBasePricePaise,
        floriaProfitRate: calc.floriaProfitRate,
        floriaProfitPaise: calc.floriaProfitPaise,
        deliveryRecoveryPaise: calc.deliveryRecoveryPaise,
        customerProductPricePaise: calc.customerProductPricePaise,
        isFreeDeliveryEligible: calc.isFreeDeliveryEligible,
      },
      commission: {
        rate: calc.sellerCommissionRate,
        amountPaise: calc.sellerCommissionPaise,
      },
      sellerEarnings: {
        basePricePaise: calc.sellerBasePricePaise,
        commissionPaise: calc.sellerCommissionPaise,
        netPaise: calc.sellerNetPaise,
      },
      customerCharges: {
        productPricePaise: calc.customerProductPricePaise,
        deliveryFeePaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: calc.customerProductPricePaise,
      },
      currency: "INR",
    };
  }

  async getOrderFinancialBreakdown(orderId: string): Promise<AdminOrderFinancialBreakdown> {
    const db = getAdminDb();

    // 1. Fetch Order details
    const { data: order } = await db
      .from("orders")
      .select("*, customer:user_profiles(full_name)")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) throw Errors.notFound("Order");

    // 2. Fetch Order Items with product snapshots
    const { data: items } = await db
      .from("order_items")
      .select("*, seller:seller_profiles(id, business_name)")
      .eq("order_id", orderId);

    // 3. Fetch Seller Order Financials (sub-order snapshots)
    const { data: sellerFinancials } = await db
      .from("seller_order_financials")
      .select("*")
      .eq("order_id", orderId);

    const finMap = new Map((sellerFinancials || []).map((f) => [f.seller_id, f]));

    // Group items by seller
    const sellerItemMap = new Map<string, any[]>();
    for (const it of items || []) {
      const sId = it.seller_id_snapshot || it.seller_id;
      if (!sellerItemMap.has(sId)) sellerItemMap.set(sId, []);
      sellerItemMap.get(sId)!.push(it);
    }

    const nurseryBreakdown: NurseryOrderFinancialAttribution[] = [];
    let totalPlatformCommission = 0;
    let totalFloriaProfit = 0;
    let totalDeliveryRecovery = 0;

    for (const [sellerId, sItems] of sellerItemMap.entries()) {
      const sellerObj = sItems[0]?.seller;
      const sellerName = sellerObj?.business_name || "Partner Nursery";
      const fin = finMap.get(sellerId);

      // Prefer per-item snapshotted rate, then seller-level, then order-level.
      // All are immutable snapshots stored at checkout. Never fabricate with a hardcode.
      const itemCommRate = sItems[0]?.commission_rate_snapshot;
      const commRate = itemCommRate ?? fin?.commission_rate ?? order.commission_rate ?? 0;

      const mappedItems = sItems.map((it) => {
        const basePrice = it.base_price_paise_snapshot ?? it.unit_price_paise_snapshot ?? 0;
        const lineGross = basePrice * it.quantity;
        const lineComm = Math.round(lineGross * commRate);
        const lineNet = lineGross - lineComm;

        totalFloriaProfit += (it.floria_profit_paise_snapshot || 0) * it.quantity;
        totalDeliveryRecovery += (it.delivery_recovery_paise_snapshot || 0) * it.quantity;

        return {
          productId: it.product_id,
          productName: it.product_name_snapshot || "Product",
          unitPricePaise: it.customer_price_paise_snapshot || it.unit_price_paise_snapshot || 0,
          quantity: it.quantity,
          lineTotalPaise: (it.customer_price_paise_snapshot || it.unit_price_paise_snapshot || 0) * it.quantity,
          commissionPaise: lineComm,
          sellerNetPaise: lineNet,
        };
      });

      const sellerGrossPaise = fin?.seller_gross_paise ?? mappedItems.reduce((s, i) => s + (i.unitPricePaise * i.quantity), 0);
      const commissionPaise = fin?.commission_paise ?? Math.round(sellerGrossPaise * commRate);
      const sellerNetPaise = fin?.seller_net_paise ?? (sellerGrossPaise - commissionPaise);

      totalPlatformCommission += commissionPaise;

      nurseryBreakdown.push({
        sellerId,
        sellerName,
        items: mappedItems,
        sellerGrossPaise,
        commissionRate: commRate * 100,
        commissionPaise,
        sellerNetPaise,
      });
    }

    const customerObj = Array.isArray(order.customer) ? order.customer[0] : order.customer;

    return {
      masterOrderId: order.id,
      customerName: customerObj?.full_name || order.delivery_address_snapshot?.full_name || "Customer",
      customerTotalPaise: order.total_paise || order.subtotal_paise || 0,
      subtotalPaise: order.subtotal_paise || 0,
      maintenanceFeePaise: order.maintenance_fee_paise || 0,
      deliveryFeePaise: order.delivery_fee_paise || 0,
      deliveryFeeReason: order.delivery_fee_reason,
      taxPaise: 0,
      discountPaise: 0,
      totalPlatformCommissionPaise: totalPlatformCommission || order.commission_paise || 0,
      totalFloriaProfitPaise: totalFloriaProfit,
      totalDeliveryRecoveryPaise: totalDeliveryRecovery,
      nurseryBreakdown,
      currency: "INR",
      createdAt: order.created_at,
    };
  }
}

export const adminFinancialService = new AdminFinancialService();
