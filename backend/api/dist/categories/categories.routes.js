"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Floria API — Categories Routes
const express_1 = require("express");
const categories_controller_js_1 = require("./categories.controller.js");
const rateLimit_js_1 = require("../middleware/rateLimit.js");
const router = (0, express_1.Router)();
router.get("/", rateLimit_js_1.publicCatalogRateLimiter, categories_controller_js_1.categoriesController.getCategories);
router.get("/:slug", rateLimit_js_1.publicCatalogRateLimiter, categories_controller_js_1.categoriesController.getCategoryBySlug);
exports.default = router;
