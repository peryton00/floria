import { describe, it, expect } from "vitest";
import { formatINR, paiseToRupees, rupeesToPaise, formatDate } from "../lib/format";

describe("Admin Web Utilities", () => {
  it("formats paise to INR currency string", () => {
    expect(formatINR(129900)).toContain("1,299");
  });

  it("converts paise to rupees correctly", () => {
    expect(paiseToRupees(25000)).toBe(250);
  });

  it("converts rupees to paise correctly", () => {
    expect(rupeesToPaise(250)).toBe(25000);
  });

  it("formats date strings safely", () => {
    const formatted = formatDate("2026-08-29T00:00:00.000Z");
    expect(formatted).toBeTruthy();
    expect(formatDate(null)).toBe("—");
  });
});
