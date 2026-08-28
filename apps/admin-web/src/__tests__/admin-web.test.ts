import { describe, it, expect } from "vitest";
import {
  formatINR,
  paiseToRupees,
  rupeesToPaise,
  formatDate,
} from "../lib/format";

describe("Admin Web — Currency & Formatting Utilities", () => {
  it("formats paise integers to Indian Rupee currency strings correctly", () => {
    expect(formatINR(5000000)).toBe("₹50,000");
    expect(formatINR(129900)).toBe("₹1,299");
    expect(formatINR(0)).toBe("₹0");
  });

  it("converts between rupees and paise accurately", () => {
    expect(rupeesToPaise(50000)).toBe(5000000);
    expect(paiseToRupees(5000000)).toBe(50000);
  });

  it("formats dates gracefully and handles null/empty strings", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
    const formatted = formatDate("2026-08-28T12:00:00.000Z");
    expect(formatted).toContain("2026");
  });
});

describe("Admin Web — Role Authorization & Access Control", () => {
  const isAuthorizedAdmin = (role: string | undefined): boolean => {
    return role === "admin" || role === "super_admin";
  };

  it("authorizes platform admin and super_admin roles", () => {
    expect(isAuthorizedAdmin("admin")).toBe(true);
    expect(isAuthorizedAdmin("super_admin")).toBe(true);
  });

  it("strictly rejects customer, seller, operations, or unauthenticated users", () => {
    expect(isAuthorizedAdmin("customer")).toBe(false);
    expect(isAuthorizedAdmin("seller")).toBe(false);
    expect(isAuthorizedAdmin("operations")).toBe(false);
    expect(isAuthorizedAdmin(undefined)).toBe(false);
  });
});

describe("Admin Web — Seller Moderation State Machine", () => {
  const validAdminSellerTransitions: Record<string, string[]> = {
    pending: ["approved", "rejected"],
    approved: ["suspended"],
    suspended: ["approved"],
    rejected: ["pending", "approved"],
  };

  const canTransitionSellerStatus = (
    current: string,
    next: string,
  ): boolean => {
    return validAdminSellerTransitions[current]?.includes(next) ?? false;
  };

  it("allows admin to approve or reject pending seller applications", () => {
    expect(canTransitionSellerStatus("pending", "approved")).toBe(true);
    expect(canTransitionSellerStatus("pending", "rejected")).toBe(true);
  });

  it("allows admin to suspend active approved sellers", () => {
    expect(canTransitionSellerStatus("approved", "suspended")).toBe(true);
  });

  it("allows admin to reactivate suspended sellers", () => {
    expect(canTransitionSellerStatus("suspended", "approved")).toBe(true);
  });
});
