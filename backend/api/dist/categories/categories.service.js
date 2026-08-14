"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesService = exports.CategoriesService = void 0;
// Floria API — Categories Service
const category_repository_js_1 = require("../database/repositories/category.repository.js");
class CategoriesService {
    async getCategories() {
        return category_repository_js_1.categoryRepository.findAllActive();
    }
    async getCategoryBySlug(slug) {
        return category_repository_js_1.categoryRepository.findBySlug(slug);
    }
}
exports.CategoriesService = CategoriesService;
exports.categoriesService = new CategoriesService();
