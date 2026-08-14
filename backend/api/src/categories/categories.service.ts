// Floria API — Categories Service
import { categoryRepository } from "../database/repositories/category.repository.js";

export class CategoriesService {
  async getCategories() {
    return categoryRepository.findAllActive();
  }

  async getCategoryBySlug(slug: string) {
    return categoryRepository.findBySlug(slug);
  }
}

export const categoriesService = new CategoriesService();
