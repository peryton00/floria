// Floria API — Products Catalog Service
import { productRepository } from "../database/repositories/product.repository.js";
import { pricingService } from "../pricing/pricing.service.js";
import { Errors } from "../utils/errors.js";

export class ProductsService {
  public enrichWithDbPricing(product: any, settings: any) {
    if (!product) return product;

    const rawInventory = product.inventory;
    if (!rawInventory) return product;

    if (Array.isArray(rawInventory)) {
      const enriched = rawInventory.map((inv: any) => {
        const basePrice = inv.price_paise ?? 0;
        const calc = pricingService.calculateProductPricingSync(basePrice, settings);
        return {
          ...inv,
          base_price_paise: basePrice,
          price_paise: calc.customerProductPricePaise,
          customer_price_paise: calc.customerProductPricePaise,
          seller_net_paise: calc.sellerNetPaise,
        };
      });
      return { ...product, inventory: enriched };
    } else {
      const basePrice = rawInventory.price_paise ?? 0;
      const calc = pricingService.calculateProductPricingSync(basePrice, settings);
      return {
        ...product,
        inventory: {
          ...rawInventory,
          base_price_paise: basePrice,
          price_paise: calc.customerProductPricePaise,
          customer_price_paise: calc.customerProductPricePaise,
          seller_net_paise: calc.sellerNetPaise,
        },
      };
    }
  }

  async getProducts(categoryId?: string, search?: string) {
    const settings = await pricingService.getFinancialSettings();
    const products = await productRepository.findActiveCatalog(categoryId, search);
    return products.map((p) => this.enrichWithDbPricing(p, settings));
  }

  async getProductBySlug(slug: string) {
    const settings = await pricingService.getFinancialSettings();
    const product = await productRepository.findBySlug(slug);
    if (!product) throw Errors.notFound("Product");
    return this.enrichWithDbPricing(product, settings);
  }
}

export const productsService = new ProductsService();
