// Floria API — Products Catalog Service
import { productRepository } from "../database/repositories/product.repository.js";
import { Errors } from "../utils/errors.js";

export class ProductsService {
  async getProducts(categoryId?: string, search?: string) {
    return productRepository.findActiveCatalog(categoryId, search);
  }

  async getProductBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw Errors.notFound("Product");
    return product;
  }
}

export const productsService = new ProductsService();
