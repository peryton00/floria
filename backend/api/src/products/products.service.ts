// Floria API — Products Catalog Service
import { productRepository } from "../database/repositories/product.repository.js";
import { pricingService } from "../pricing/pricing.service.js";
import { getAdminDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";

export class ProductsService {
  public enrichWithDbPricing(
    product: any,
    settings: any,
    overrideMap?: Map<string, any>,
    isSellerContext: boolean = false,
  ) {
    if (!product) return product;

    const rawInventory = product.inventory;
    if (!rawInventory) return product;

    const override = overrideMap?.get(product.id);

    const enrichSingle = (inv: any) => {
      const basePrice = inv.base_price_paise ?? inv.price_paise ?? 0;
      const calc = pricingService.calculateProductPricingSync(
        basePrice,
        settings,
      );

      const customerPrice =
        override?.custom_customer_price_paise ?? calc.customerProductPricePaise;
      const originalPrice =
        inv.original_price_paise && inv.original_price_paise > customerPrice
          ? inv.original_price_paise
          : null;
      const discountAmount = originalPrice ? originalPrice - customerPrice : 0;
      const discountPercent = originalPrice
        ? Math.round((discountAmount / originalPrice) * 100)
        : 0;

      return {
        ...inv,
        base_price_paise: basePrice,
        // In seller context, price_paise must ALWAYS be the seller's original base price.
        // In customer storefront context, price_paise is the final customer price.
        price_paise: isSellerContext ? basePrice : customerPrice,
        customer_price_paise: customerPrice,
        seller_net_paise: calc.sellerNetPaise,
        pricing: {
          sellerBasePricePaise: basePrice,
          customerPricePaise: customerPrice,
          sellingPricePaise: customerPrice,
          originalPricePaise: originalPrice,
          compareAtPricePaise: originalPrice,
          discountAmountPaise: discountAmount,
          discountPercentage: discountPercent,
          isDiscounted: discountAmount > 0,
          isFreeDelivery: calc.isFreeDeliveryEligible,
          isOverride: Boolean(override),
        },
      };
    };

    if (Array.isArray(rawInventory)) {
      const enriched = rawInventory.map(enrichSingle);
      const primaryPricing = enriched[0]?.pricing;
      return { ...product, inventory: enriched, pricing: primaryPricing };
    } else {
      const enriched = enrichSingle(rawInventory);
      return {
        ...product,
        inventory: enriched,
        pricing: enriched.pricing,
      };
    }
  }

  async getProducts(
    categoryIdOrSlug?: string,
    search?: string,
    sellerId?: string,
    limit?: number,
  ) {
    const settings = await pricingService.getFinancialSettings();
    const products = await productRepository.findActiveCatalog(
      categoryIdOrSlug,
      search,
      sellerId,
      limit,
    );

    // Check for active overrides in parallel
    const overrideMap = await this.getActiveOverridesMap();
    return products.map((p) =>
      this.enrichWithDbPricing(p, settings, overrideMap),
    );
  }

  async getProductBySlug(slug: string) {
    const settings = await pricingService.getFinancialSettings();
    const product = await productRepository.findBySlug(slug);
    if (!product) throw Errors.notFound("Product");

    const overrideMap = await this.getActiveOverridesMap();
    return this.enrichWithDbPricing(product, settings, overrideMap);
  }

  async getRelated(productId: string, categoryId: string | null, limit = 6) {
    const settings = await pricingService.getFinancialSettings();
    const products = await productRepository.findRelated(
      productId,
      categoryId,
      limit,
    );
    const overrideMap = await this.getActiveOverridesMap();
    return products.map((p) =>
      this.enrichWithDbPricing(p, settings, overrideMap),
    );
  }

  async getTrending(limit = 12) {
    const settings = await pricingService.getFinancialSettings();
    const products = await productRepository.findTrending(limit);
    const overrideMap = await this.getActiveOverridesMap();
    return products.map((p) =>
      this.enrichWithDbPricing(p, settings, overrideMap),
    );
  }

  private async getActiveOverridesMap(): Promise<Map<string, any>> {
    try {
      const db = getAdminDb();
      const { data } = await db
        .from("product_pricing_overrides")
        .select("product_id, custom_customer_price_paise, reason")
        .eq("is_active", true);

      if (!data) return new Map();
      return new Map(data.map((o: any) => [o.product_id, o]));
    } catch {
      return new Map();
    }
  }
}

export const productsService = new ProductsService();
