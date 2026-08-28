// Floria Standalone REST API Application Setup
import express from "express";
import { createSecurityMiddleware } from "./middleware/security.js";
import { createCorsMiddleware } from "./middleware/cors.js";
import { requestCorrelationMiddleware } from "./middleware/requestCorrelation.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { getAdminDb } from "./config/database.js";

// Domain Route Modules
import authRoutes from "./auth/auth.routes.js";
import productsRoutes from "./products/products.routes.js";
import categoriesRoutes from "./categories/categories.routes.js";
import cartRoutes from "./cart/cart.routes.js";
import checkoutRoutes from "./checkout/checkout.routes.js";
import ordersRoutes from "./orders/orders.routes.js";
import fulfillmentRoutes from "./fulfillment/fulfillment.routes.js";
import sellersRoutes from "./sellers/sellers.routes.js";
import usersRoutes from "./users/users.routes.js";
import adminRoutes from "./admin/admin.routes.js";
import operationsRoutes from "./operations/operations.routes.js";
import wishlistRoutes from "./wishlist/wishlist.routes.js";
import paymentsRoutes from "./payments/payments.routes.js";
import notificationsRoutes from "./notifications/notifications.routes.js";
import reportsRoutes from "./reports/reports.routes.js";
import reviewsRoutes from "./reviews/reviews.routes.js";
import mediaRoutes from "./media/media.routes.js";

export function createApp() {
  const app = express();

  // 1. Security, CORS & Correlation Logging
  app.use(requestCorrelationMiddleware);
  app.use(createCorsMiddleware());
  app.use(createSecurityMiddleware());

  // 2. Request Parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // 3. Root & Health Check Endpoints
  app.get("/", (_req, res) => {
    res.json({
      service: "floria-api",
      status: "online",
      version: "v1",
      health: "/health",
      api: "/api/v1",
    });
  });

  app.head("/", (_req, res) => {
    res.status(200).end();
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "healthy",
      service: "floria-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/ready", async (_req, res) => {
    try {
      const db = getAdminDb();
      const { data, error } = await db.from("categories").select("id").limit(1);
      if (error) throw error;
      res.json({
        status: "ready",
        database: "connected",
        categoriesFound: data ? data.length : 0,
      });
    } catch (err: any) {
      console.error("[Floria API /ready] Readiness probe check failed:", err);
      res.status(503).json({
        status: "unready",
        database: "disconnected",
        error: err?.message || String(err),
      });
    }
  });

  // 4. Versioned API V1 Routes (/api/v1)
  const apiV1 = express.Router();

  apiV1.use("/auth", authRoutes);
  apiV1.use("/catalog/products", productsRoutes);
  apiV1.use("/catalog/categories", categoriesRoutes);
  apiV1.use("/customer/cart", cartRoutes);
  apiV1.use("/customer/checkout", checkoutRoutes);
  apiV1.use("/customer/orders", ordersRoutes);
  apiV1.use("/customer/wishlist", wishlistRoutes);
  apiV1.use("/customer/users", usersRoutes);

  apiV1.use("/seller/fulfillment", fulfillmentRoutes);
  apiV1.use("/seller", sellersRoutes);

  apiV1.use("/operations", operationsRoutes);
  apiV1.use("/admin", adminRoutes);

  apiV1.use("/payments", paymentsRoutes);
  apiV1.use("/notifications", notificationsRoutes);
  apiV1.use("/reports", reportsRoutes);
  apiV1.use("/media", mediaRoutes);
  app.use("/api/v1", reviewsRoutes); // reviews routes self-contain full paths

  app.use("/api/v1", apiV1);

  // 5. 404 Route Handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: "RESOURCE_NOT_FOUND", message: "Endpoint not found." },
    });
  });

  // 6. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
