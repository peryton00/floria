import { describe, it, expect } from "vitest";
import { formatINR, paiseToRupees, rupeesToPaise, formatDate } from "../lib/format";

describe("Seller Web Utilities", () => {
  it("formats paise to INR currency string", () => {
    expect(formatINR(49900)).toContain("499");
  });

  it("converts paise to rupees correctly", () => {
    expect(paiseToRupees(15000)).toBe(150);
  });

  it("converts rupees to paise correctly", () => {
    expect(rupeesToPaise(150)).toBe(15000);
  });

  it("formats date strings safely", () => {
    const formatted = formatDate("2026-08-29T00:00:00.000Z");
    expect(formatted).toBeTruthy();
    expect(formatDate(null)).toBe("—");
  });
});
