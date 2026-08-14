"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesController = exports.CategoriesController = void 0;
const categories_service_js_1 = require("./categories.service.js");
class CategoriesController {
    async getCategories(_req, res, next) {
        try {
            const categories = await categories_service_js_1.categoriesService.getCategories();
            res.json({ success: true, data: categories });
        }
        catch (err) {
            next(err);
        }
    }
    async getCategoryBySlug(req, res, next) {
        try {
            const category = await categories_service_js_1.categoriesService.getCategoryBySlug(String(req.params.slug));
            res.json({ success: true, data: category });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.CategoriesController = CategoriesController;
exports.categoriesController = new CategoriesController();
