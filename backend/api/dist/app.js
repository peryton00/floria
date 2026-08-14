"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
// Floria Standalone REST API Application Setup
const express_1 = __importDefault(require("express"));
const security_js_1 = require("./middleware/security.js");
const cors_js_1 = require("./middleware/cors.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const database_js_1 = require("./config/database.js");
// Domain Route Modules
const auth_routes_js_1 = __importDefault(require("./auth/auth.routes.js"));
const products_routes_js_1 = __importDefault(require("./products/products.routes.js"));
const categories_routes_js_1 = __importDefault(require("./categories/categories.routes.js"));
const cart_routes_js_1 = __importDefault(require("./cart/cart.routes.js"));
const checkout_routes_js_1 = __importDefault(require("./checkout/checkout.routes.js"));
const orders_routes_js_1 = __importDefault(require("./orders/orders.routes.js"));
const fulfillment_routes_js_1 = __importDefault(require("./fulfillment/fulfillment.routes.js"));
const sellers_routes_js_1 = __importDefault(require("./sellers/sellers.routes.js"));
const users_routes_js_1 = __importDefault(require("./users/users.routes.js"));
const admin_routes_js_1 = __importDefault(require("./admin/admin.routes.js"));
const operations_routes_js_1 = __importDefault(require("./operations/operations.routes.js"));
const inventory_routes_js_1 = __importDefault(require("./inventory/inventory.routes.js"));
const wishlist_routes_js_1 = __importDefault(require("./wishlist/wishlist.routes.js"));
const payments_routes_js_1 = __importDefault(require("./payments/payments.routes.js"));
const payouts_routes_js_1 = __importDefault(require("./payouts/payouts.routes.js"));
const notifications_routes_js_1 = __importDefault(require("./notifications/notifications.routes.js"));
const reports_routes_js_1 = __importDefault(require("./reports/reports.routes.js"));
function createApp() {
    const app = (0, express_1.default)();
    // 1. Security & CORS
    app.use((0, cors_js_1.createCorsMiddleware)());
    app.use((0, security_js_1.createSecurityMiddleware)());
    // 2. Request Parsing
    app.use(express_1.default.json({ limit: "2mb" }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // 3. Health & Readiness Endpoints
    app.get("/health", (_req, res) => {
        res.json({
            status: "healthy",
            service: "floria-api",
            timestamp: new Date().toISOString(),
        });
    });
    app.get("/ready", async (_req, res) => {
        try {
            const db = (0, database_js_1.getAdminDb)();
            const { error } = await db.from("categories").select("id").limit(1);
            if (error)
                throw error;
            res.json({ status: "ready", database: "connected" });
        }
        catch (err) {
            res.status(503).json({ status: "unready", database: "disconnected" });
        }
    });
    // 4. Versioned API V1 Routes (/api/v1)
    const apiV1 = express_1.default.Router();
    apiV1.use("/auth", auth_routes_js_1.default);
    apiV1.use("/catalog/products", products_routes_js_1.default);
    apiV1.use("/catalog/categories", categories_routes_js_1.default);
    apiV1.use("/customer/cart", cart_routes_js_1.default);
    apiV1.use("/customer/checkout", checkout_routes_js_1.default);
    apiV1.use("/customer/orders", orders_routes_js_1.default);
    apiV1.use("/customer/wishlist", wishlist_routes_js_1.default);
    apiV1.use("/customer/users", users_routes_js_1.default);
    apiV1.use("/seller/fulfillment", fulfillment_routes_js_1.default);
    apiV1.use("/seller/inventory", inventory_routes_js_1.default);
    apiV1.use("/seller/payouts", payouts_routes_js_1.default);
    apiV1.use("/seller", sellers_routes_js_1.default);
    apiV1.use("/operations", operations_routes_js_1.default);
    apiV1.use("/admin", admin_routes_js_1.default);
    apiV1.use("/payments", payments_routes_js_1.default);
    apiV1.use("/notifications", notifications_routes_js_1.default);
    apiV1.use("/reports", reports_routes_js_1.default);
    app.use("/api/v1", apiV1);
    // 5. 404 Route Handler
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: { code: "RESOURCE_NOT_FOUND", message: "Endpoint not found." },
        });
    });
    // 6. Centralized Error Handler
    app.use(errorHandler_js_1.errorHandler);
    return app;
}
