// Floria API — C3 Session Token Forgery & Verification Test Suite
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { signSessionToken } from "../src/utils/session-token.js";
import { getEnv } from "../src/config/env.js";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("../src/config/database.js", () => {
  return {
    getAdminDb: () => ({
      from: mockFrom,
    }),
    getAnonDb: () => ({
      auth: {
        getUser: mockGetUser,
      },
    }),
    getUserDb: () => ({}),
    getDbForUser: () => ({
      from: mockFrom,
    }),
  };
});

describe("C3: Session Token Forgery Protection", () => {
  let app: ReturnType<typeof createApp>;
  const env = getEnv();

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();

    // Mock Supabase Auth to simulate non-Supabase custom token fallback
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Invalid JWT token"),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_profiles") {
        return {
          select: () => ({
            eq: (_f: string, id: string) => ({
              maybeSingle: async () => ({
                data: id.includes("seller")
                  ? { id, role: "seller" }
                  : id.includes("courier")
                  ? { id, role: "delivery_partner" }
                  : null,
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "seller_profiles") {
        return {
          select: () => ({
            eq: (_f: string, id: string) => ({
              maybeSingle: async () => ({
                data: id.includes("seller")
                  ? { id: "slr-legit-seller", user_id: "usr-legit-seller", status: "approved" }
                  : null,
                error: null,
              }),
            }),
            or: (clause: string) => ({
              maybeSingle: async () => ({
                data: clause.includes("seller")
                  ? { id: "slr-legit-seller", user_id: "usr-legit-seller", status: "approved" }
                  : null,
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "delivery_partners") {
        return {
          select: () => ({
            eq: (_f: string, id: string) => ({
              maybeSingle: async () => ({
                data: id.includes("courier")
                  ? { id: "drv-legit-courier", user_id: "usr-legit-courier", status: "active", full_name: "Legit Courier" }
                  : null,
                error: null,
              }),
            }),
            or: (clause: string) => ({
              maybeSingle: async () => ({
                data: clause.includes("courier")
                  ? { id: "drv-legit-courier", user_id: "usr-legit-courier", status: "active", full_name: "Legit Courier" }
                  : null,
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "inventory") {
        return {
          select: () => ({
            or: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      };
    });
  });

  it("strictly rejects unsigned raw base64url tokens crafted by an attacker (returns 401)", async () => {
    const fakePayload = {
      sub: "usr-victim-seller",
      seller_id: "slr-victim-seller",
      email: "victim@seller.floria.in",
      role: "seller",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const unsignedToken = Buffer.from(JSON.stringify(fakePayload)).toString("base64url");

    const res = await request(app)
      .get("/api/v1/seller/inventory")
      .set("Authorization", `Bearer ${unsignedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain("Session expired or invalid");
  });

  it("strictly rejects tokens signed with an invalid or guessed HMAC secret (returns 401)", async () => {
    const fakePayload = {
      sub: "usr-victim-seller",
      seller_id: "slr-victim-seller",
      role: "seller",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const forgedToken = signSessionToken(fakePayload as any, "attacker-wrong-secret-12345");

    const res = await request(app)
      .get("/api/v1/seller/inventory")
      .set("Authorization", `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
  });

  it("strictly rejects tokens where the payload has been tampered with after signing", async () => {
    const legitPayload = {
      sub: "usr-attacker",
      seller_id: "slr-attacker",
      role: "seller",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const validToken = signSessionToken(legitPayload as any, env.SELLER_SESSION_SECRET);
    const [payloadB64, sig] = validToken.split(".");

    // Attacker modifies payload to victim's seller_id but keeps original signature
    const tamperedPayload = { ...legitPayload, seller_id: "slr-victim-seller" };
    const tamperedB64 = Buffer.from(JSON.stringify(tamperedPayload)).toString("base64url");
    const tamperedToken = `${tamperedB64}.${sig}`;

    const res = await request(app)
      .get("/api/v1/seller/inventory")
      .set("Authorization", `Bearer ${tamperedToken}`);

    expect(res.status).toBe(401);
  });

  it("strictly rejects expired signed tokens", async () => {
    const expiredPayload = {
      sub: "usr-legit-seller",
      seller_id: "slr-legit-seller",
      role: "seller",
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
    };
    const expiredToken = signSessionToken(expiredPayload as any, env.SELLER_SESSION_SECRET);

    const res = await request(app)
      .get("/api/v1/seller/inventory")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });

  it("accepts a legitimately signed seller session token", async () => {
    const legitPayload = {
      sub: "usr-legit-seller",
      seller_id: "slr-legit-seller",
      email: "legit@seller.floria.in",
      role: "seller",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const validToken = signSessionToken(legitPayload as any, env.SELLER_SESSION_SECRET);

    const res = await request(app)
      .get("/api/v1/seller/inventory")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("accepts a legitimately signed delivery partner session token", async () => {
    const legitCourierPayload = {
      sub: "usr-legit-courier",
      delivery_partner_id: "drv-legit-courier",
      email: "courier@floria.in",
      role: "delivery_partner",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const validToken = signSessionToken(legitCourierPayload as any, env.DELIVERY_SESSION_SECRET);

    const res = await request(app)
      .get("/api/v1/delivery-partners/me")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
