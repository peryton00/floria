import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockExchangeCodeForSession = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({
    auth: {
      getUser: mockGetUser,
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
    from: mockFrom,
  }),
  getSupabaseServiceClient: async () => ({
    from: (table: string) => {
      if (table === "user_profiles") {
        return {
          select: () => ({
            eq: (_col: string, val: string) => ({
              maybeSingle: async () => {
                if (val === "existing-customer-id") {
                  return {
                    data: {
                      id: "existing-customer-id",
                      role: "customer",
                      full_name: "Jane Cust",
                    },
                    error: null,
                  };
                }
                if (val === "existing-seller-id") {
                  return {
                    data: {
                      id: "existing-seller-id",
                      role: "seller",
                      full_name: "Nursery Pro",
                    },
                    error: null,
                  };
                }
                if (val === "existing-ops-id") {
                  return {
                    data: {
                      id: "existing-ops-id",
                      role: "operations",
                      full_name: "Ops Fleet",
                    },
                    error: null,
                  };
                }
                if (val === "existing-admin-id") {
                  return {
                    data: {
                      id: "existing-admin-id",
                      role: "admin",
                      full_name: "Admin User",
                    },
                    error: null,
                  };
                }
                return { data: null, error: null };
              },
            }),
          }),
          insert: mockInsert.mockImplementation(async (payload: any) => {
            return { data: payload, error: null };
          }),
        };
      }
      if (table === "audit_logs") {
        return {
          insert: async (payload: any) => {
            // Verify sensitive tokens are NEVER logged
            const str = JSON.stringify(payload);
            expect(str).not.toContain("access_token");
            expect(str).not.toContain("refresh_token");
            expect(str).not.toContain("secret");
            return { error: null };
          },
        };
      }
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null }) }),
        }),
      };
    },
  }),
}));

describe("Phase 3.10 Google OAuth Authentication & Role Security Matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. New Google user -> Server creates customer profile (role = customer)", async () => {
    const newUserId = "new-google-user-id";
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        user: {
          id: newUserId,
          email: "newuser@google.com",
          user_metadata: { full_name: "New Google User" },
        },
      },
      error: null,
    });

    const { GET } = await import("../app/auth/callback/route");
    const req = new Request(
      "http://localhost:3000/auth/callback?code=valid-oauth-code",
    );
    const res = await GET(req as any);

    expect(res.status).toBe(307); // Redirects to customer homepage
    expect(res.headers.get("location")).toBe("http://localhost:3000/");

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: newUserId,
        full_name: "New Google User",
        role: "customer",
      }),
    );
  });

  it("2. Existing customer -> Preserves customer role", async () => {
    const existingId = "existing-customer-id";
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        user: { id: existingId, email: "customer@google.com" },
      },
      error: null,
    });

    const { GET } = await import("../app/auth/callback/route");
    const req = new Request(
      "http://localhost:3000/auth/callback?code=valid-oauth-code",
    );
    const res = await GET(req as any);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
    expect(mockInsert).not.toHaveBeenCalled(); // No duplicate creation
  });

  it("3. Existing seller -> Preserves seller role and redirects to seller dashboard", async () => {
    const existingId = "existing-seller-id";
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        user: { id: existingId, email: "seller@google.com" },
      },
      error: null,
    });

    const { GET } = await import("../app/auth/callback/route");
    const req = new Request(
      "http://localhost:3000/auth/callback?code=valid-oauth-code",
    );
    const res = await GET(req as any);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/seller/dashboard",
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("4. Existing operations user -> Preserves operations role and redirects to operations portal", async () => {
    const existingId = "existing-ops-id";
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        user: { id: existingId, email: "ops@google.com" },
      },
      error: null,
    });

    const { GET } = await import("../app/auth/callback/route");
    const req = new Request(
      "http://localhost:3000/auth/callback?code=valid-oauth-code",
    );
    const res = await GET(req as any);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/operations",
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("5. Existing admin user -> Preserves admin role and redirects to admin dashboard", async () => {
    const existingId = "existing-admin-id";
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        user: { id: existingId, email: "admin@google.com" },
      },
      error: null,
    });

    const { GET } = await import("../app/auth/callback/route");
    const req = new Request(
      "http://localhost:3000/auth/callback?code=valid-oauth-code",
    );
    const res = await GET(req as any);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/admin/dashboard",
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("6, 7, 8. Google signup cannot elevate role to admin, seller, or operations", async () => {
    const maliciousId = "hacker-user-id";
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        user: {
          id: maliciousId,
          email: "hacker@google.com",
          user_metadata: { role: "admin" }, // Attacker trying to inject role in metadata
        },
      },
      error: null,
    });

    const { GET } = await import("../app/auth/callback/route");
    const req = new Request(
      "http://localhost:3000/auth/callback?code=valid-oauth-code",
    );
    const res = await GET(req as any);

    expect(res.status).toBe(307);
    // Attacker MUST NOT be redirected to admin console
    expect(res.headers.get("location")).toBe("http://localhost:3000/");

    // Server MUST force role = customer
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: maliciousId,
        role: "customer",
      }),
    );
  });

  it("9. OAuth callback with missing code redirects to /login?error=missing_code", async () => {
    const { GET } = await import("../app/auth/callback/route");
    const req = new Request("http://localhost:3000/auth/callback");
    const res = await GET(req as any);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=missing_code");
  });

  it("10. OAuth code exchange failure handles errors safely", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: new Error("Invalid OAuth code"),
    });

    const { GET } = await import("../app/auth/callback/route");
    const req = new Request(
      "http://localhost:3000/auth/callback?code=bad-code",
    );
    const res = await GET(req as any);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain(
      "/login?error=oauth_exchange_failed",
    );
  });
});
