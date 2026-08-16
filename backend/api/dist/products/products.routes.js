"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Products Public Catalog Routes
const express_1 = require("express");
const products_controller_js_1 = require("./products.controller.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const router = (0, express_1.Router)();
router.get("/", rateLimit_js_1.publicCatalogRateLimiter, products_controller_js_1.productsController.getProducts);
router.get("/trending", rateLimit_js_1.publicCatalogRateLimiter, products_controller_js_1.productsController.getTrending);
router.get("/:slug", rateLimit_js_1.publicCatalogRateLimiter, products_controller_js_1.productsController.getProductBySlug);
router.get("/:slug/related", rateLimit_js_1.publicCatalogRateLimiter, products_controller_js_1.productsController.getRelated);
exports.default = router;
// Nursery ranked listing is at /api/v1/catalog/sellers — mounted in reviews.routes.ts
