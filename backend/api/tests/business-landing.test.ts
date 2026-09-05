// Floria API — Business Landing Public Endpoints Verification Tests
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import * as dbModule from "../src/config/database.js";

describe("Floria Business Public Landing Endpoints", () => {
  let app: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    app = createApp();
  });

  it("GET /api/v1/catalog/public/stats returns live aggregate metrics", async () => {
    vi.spyOn(dbModule, "getAdminDb").mockReturnValue({
      from: (table: string) => {
        if (table === "seller_profiles") {
          return {
            select: (_cols?: string, opts?: any) => {
              if (opts?.count) {
                return {
                  eq: () => ({
                    eq: () => Promise.resolve({ count: 42, data: null, error: null }),
                  }),
                };
              }
              return {
                eq: () => ({
                  not: () => Promise.resolve({
                    data: [
                      { city: "Raipur" },
                      { city: "Bhilai" },
                      { city: "raipur" },
                      { city: "Delhi" },
                    ],
                    error: null,
                  }),
                }),
              };
            },
          };
        }
        if (table === "products") {
          return {
            select: () => ({
              eq: () => ({
                is: () => Promise.resolve({ count: 180, data: null, error: null }),
              }),
            }),
          };
        }
        if (table === "orders") {
          return {
            select: () => ({
              in: () => Promise.resolve({ count: 320, data: null, error: null }),
            }),
          };
        }
        if (table === "seller_rating_summary") {
          return {
            select: () => Promise.resolve({
              data: [
                { avg_rating: 4.8, review_count: 50 },
                { avg_rating: 5.0, review_count: 50 },
              ],
              error: null,
            }),
          };
        }
        if (table === "categories") {
          return {
            select: () => ({
              eq: () => Promise.resolve({ count: 8, data: null, error: null }),
            }),
          };
        }
        return {
          select: () => Promise.resolve({ data: [], error: null }),
        };
      },
    } as any);

    const res = await request(app).get("/api/v1/catalog/public/stats");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalSellers).toBe(42);
    expect(res.body.data.totalProducts).toBe(180);
    expect(res.body.data.citiesCovered).toBe(3); // "Raipur", "Bhilai", "Delhi" (deduped)
    expect(res.body.data.ordersCompleted).toBe(320);
    expect(res.body.data.avgRating).toBe(4.9);
  });

  it("GET /api/v1/catalog/sellers?limit=3 returns top 3 ranked businesses with sanitized public data", async () => {
    vi.spyOn(dbModule, "getAdminDb").mockReturnValue({
      from: (table: string) => {
        if (table === "seller_profiles") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  limit: () => Promise.resolve({
                    data: [
                      {
                        id: "seller-1",
                        business_name: "Green Leaf Botanical",
                        city: "Raipur",
                        state: "Chhattisgarh",
                        logo_url: "https://example.com/logo1.webp",
                        business_type: "Botanical Nursery",
                        rating_summary: {
                          avg_rating: 4.9,
                          review_count: 342,
                          ranking_score: 95.5,
                        },
                      },
                      {
                        id: "seller-2",
                        business_name: "Petal & Vine Florals",
                        city: "Raipur",
                        state: "Chhattisgarh",
                        logo_url: "https://example.com/logo2.webp",
                        business_type: "Florist & Bouquets",
                        rating_summary: {
                          avg_rating: 4.8,
                          review_count: 281,
                          ranking_score: 92.1,
                        },
                      },
                      {
                        id: "seller-3",
                        business_name: "The Garden Store",
                        city: "Bhilai",
                        state: "Chhattisgarh",
                        logo_url: "https://example.com/logo3.webp",
                        business_type: "Gardening Tools & Supplies",
                        rating_summary: {
                          avg_rating: 4.8,
                          review_count: 214,
                          ranking_score: 89.4,
                        },
                      },
                      {
                        id: "seller-4",
                        business_name: "Lawn Masters",
                        city: "Bilaspur",
                        state: "Chhattisgarh",
                        logo_url: "https://example.com/logo4.webp",
                        business_type: "Soils & Fertilizers",
                        rating_summary: {
                          avg_rating: 4.5,
                          review_count: 50,
                          ranking_score: 75.0,
                        },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => Promise.resolve({ data: [], error: null }),
        };
      },
    } as any);

    const res = await request(app).get("/api/v1/catalog/sellers?limit=3");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data[0].business_name).toBe("Green Leaf Botanical");
    expect(res.body.data[1].business_name).toBe("Petal & Vine Florals");
    expect(res.body.data[2].business_name).toBe("The Garden Store");
  });
});
