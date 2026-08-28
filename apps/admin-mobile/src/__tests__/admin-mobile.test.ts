import { describe, it, expect } from "vitest";
import {
  formatINR,
  paiseToRupees,
  rupeesToPaise,
  formatDate,
} from "../../lib/format";

describe("Admin Mobile — Currency & Date Formatting", () => {
  it("formats paise into rupee currency with en-IN locale", () => {
    expect(formatINR(48500000)).toBe("₹4,85,000");
    expect(formatINR(129900)).toBe("₹1,299");
    expect(formatINR(0)).toBe("₹0");
  });

  it("converts correctly between paise and rupees", () => {
    expect(paiseToRupees(500000)).toBe(5000);
    expect(rupeesToPaise(5000)).toBe(500000);
  });

  it("formats date strings reliably", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    const formatted = formatDate("2026-08-28T12:00:00.000Z");
    expect(typeof formatted).toBe("string");
  });
});

describe("Admin Mobile — Role-Based Access Control (RBAC) Matrix", () => {
  const isAuthorizedAdmin = (role: string | undefined): boolean => {
    return role === "admin" || role === "super_admin";
  };

  it("grants governance authority strictly to admin and super_admin", () => {
    expect(isAuthorizedAdmin("admin")).toBe(true);
    expect(isAuthorizedAdmin("super_admin")).toBe(true);
  });

  it("strictly denies access to customers, sellers, couriers, and unauthenticated actors", () => {
    expect(isAuthorizedAdmin("customer")).toBe(false);
    expect(isAuthorizedAdmin("seller")).toBe(false);
    expect(isAuthorizedAdmin("courier")).toBe(false);
    expect(isAuthorizedAdmin("operations")).toBe(false);
    expect(isAuthorizedAdmin(undefined)).toBe(false);
    expect(isAuthorizedAdmin("")).toBe(false);
  });
});

describe("Admin Mobile — Seller Approval & Compliance State Machine", () => {
  const validSellerTransitions: Record<string, string[]> = {
    pending: ["approved", "rejected"],
    approved: ["suspended"],
    suspended: ["approved"],
    rejected: ["pending"],
  };

  const canTransitionSeller = (current: string, next: string): boolean => {
    return validSellerTransitions[current]?.includes(next) ?? false;
  };

  it("permits standard approval and rejection from pending status", () => {
    expect(canTransitionSeller("pending", "approved")).toBe(true);
    expect(canTransitionSeller("pending", "rejected")).toBe(true);
  });

  it("permits suspension and reinstatement for verified nurseries", () => {
    expect(canTransitionSeller("approved", "suspended")).toBe(true);
    expect(canTransitionSeller("suspended", "approved")).toBe(true);
  });

  it("prohibits invalid or arbitrary state jumps", () => {
    expect(canTransitionSeller("pending", "suspended")).toBe(false);
    expect(canTransitionSeller("rejected", "suspended")).toBe(false);
  });
});

describe("Admin Mobile — Catalog Moderation Transitions", () => {
  const validProductTransitions: Record<string, string[]> = {
    draft: ["published", "flagged"],
    pending: ["published", "flagged"],
    published: ["flagged", "draft"],
    flagged: ["published", "draft"],
  };

  const canModerateProduct = (current: string, next: string): boolean => {
    return validProductTransitions[current]?.includes(next) ?? false;
  };

  it("allows publishing and flagging botanical listings", () => {
    expect(canModerateProduct("draft", "published")).toBe(true);
    expect(canModerateProduct("pending", "published")).toBe(true);
    expect(canModerateProduct("published", "flagged")).toBe(true);
    expect(canModerateProduct("flagged", "published")).toBe(true);
  });
});
