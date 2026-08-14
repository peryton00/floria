"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Products Public Catalog Routes
const express_1 = require("express");
const products_controller_js_1 = require("./products.controller.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const router = (0, express_1.Router)();
router.get("/", rateLimit_js_1.publicCatalogRateLimiter, products_controller_js_1.productsController.getProducts);
router.get("/:slug", rateLimit_js_1.publicCatalogRateLimiter, products_controller_js_1.productsController.getProductBySlug);
exports.default = router;
