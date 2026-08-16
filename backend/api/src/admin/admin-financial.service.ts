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
      .select("price_paise, sku")
      .eq("product_id", productId)
      .maybeSingle();

    const baseSellingPrice = inv?.price_paise ?? 0;
    const sellerObj = Array.isArray(prod.seller) ? prod.seller[0] : prod.seller;

    // 2. Fetch Server-Authoritative Platform Commission Rate
    const commissionPct = await settingsRepository.getCommissionRate(); // e.g. 12 (for 12%)
    const commissionDecimal = commissionPct / 100.0;

    // 3. Integer Paise Server Calculations
    const basePricePaise = baseSellingPrice;
    const discountPaise = 0; // Not configured on product level currently
    const sellingPricePaise = baseSellingPrice;

    const commissionAmountPaise = Math.round(sellingPricePaise * commissionDecimal);
    const sellerGrossPaise = sellingPricePaise;
    const sellerNetPaise = sellerGrossPaise - commissionAmountPaise;

    const deliveryFeePaise = 0; // Not configured / Free delivery
    const taxPaise = 0; // Tax rules not configured
    const totalPaise = sellingPricePaise + deliveryFeePaise + taxPaise;

    return {
      product: {
        id: prod.id,
        name: prod.name,
        sellerId: prod.seller_id,
        sellerName: sellerObj?.business_name || "Partner Nursery",
      },
      pricing: {
        basePricePaise,
        discountPaise,
        sellingPricePaise,
      },
      commission: {
        rate: commissionPct,
        amountPaise: commissionAmountPaise,
      },
      sellerEarnings: {
        grossPaise: sellerGrossPaise,
        netPaise: sellerNetPaise,
      },
      customerCharges: {
        deliveryFeePaise,
        taxPaise,
        discountPaise: 0,
        totalPaise,
      },
      currency: "INR",
      configuredRules: {
        taxConfigured: false,
        deliveryConfigured: false,
      },
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

    for (const [sellerId, sItems] of sellerItemMap.entries()) {
      const sellerObj = sItems[0]?.seller;
      const sellerName = sellerObj?.business_name || "Partner Nursery";
      const fin = finMap.get(sellerId);

      const commRate = fin?.commission_rate ?? order.commission_rate ?? 0.12;

      const mappedItems = sItems.map((it) => {
        const lineGross = (it.unit_price_paise_snapshot || 0) * it.quantity;
        const lineComm = Math.round(lineGross * commRate);
        const lineNet = lineGross - lineComm;
        return {
          productId: it.product_id,
          productName: it.product_name_snapshot || "Product",
          unitPricePaise: it.unit_price_paise_snapshot || 0,
          quantity: it.quantity,
          lineTotalPaise: lineGross,
          commissionPaise: lineComm,
          sellerNetPaise: lineNet,
        };
      });

      const sellerGrossPaise = fin?.seller_gross_paise ?? mappedItems.reduce((s, i) => s + i.lineTotalPaise, 0);
      const commissionPaise = fin?.commission_paise ?? Math.round(sellerGrossPaise * commRate);
      const sellerNetPaise = fin?.seller_net_paise ?? (sellerGrossPaise - commissionPaise);

      totalPlatformCommission += commissionPaise;

      nurseryBreakdown.push({
        sellerId,
        sellerName,
        items: mappedItems,
        sellerGrossPaise,
        commissionRate: commRate * 100, // percentage e.g. 12
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
      deliveryFeePaise: order.delivery_fee_paise || 0,
      taxPaise: 0,
      discountPaise: 0,
      totalPlatformCommissionPaise: totalPlatformCommission || order.commission_paise || 0,
      nurseryBreakdown,
      currency: "INR",
      createdAt: order.created_at,
    };
  }
}

export const adminFinancialService = new AdminFinancialService();
