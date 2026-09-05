// Floria API — C4 Fail-Closed getDbForUser Regression Test Suite
import { describe, it, expect, vi } from "vitest";
import { getDbForUser, getAdminDb } from "../src/config/database.js";
import { cartService } from "../src/cart/cart.service.js";
import { checkoutService } from "../src/checkout/checkout.service.js";
import { wishlistService } from "../src/wishlist/wishlist.service.js";
import { addressService } from "../src/users/addresses.service.js";

describe("C4: Fail-Closed getDbForUser & Service Authentication", () => {
  it("throws AuthRequiredError when user token is undefined or missing", () => {
    expect(() => getDbForUser(undefined)).toThrow();
  });

  it("throws AuthRequiredError when user token is empty string or too short", () => {
    expect(() => getDbForUser("")).toThrow();
    expect(() => getDbForUser("short")).toThrow();
  });

  it("never returns the admin client when given an invalid token", () => {
    let client: any = null;
    try {
      client = getDbForUser("invalid");
    } catch {
      // Expected exception
    }
    const adminClient = getAdminDb();
    expect(client).not.toBe(adminClient);
    expect(client).toBeNull();
  });

  it("cartService.getCart fails closed when token is missing", async () => {
    await expect(cartService.getCart("usr-test-123", undefined)).rejects.toThrow();
  });

  it("wishlistService.getWishlist fails closed when token is missing", async () => {
    await expect(wishlistService.getWishlist("usr-test-123", undefined)).rejects.toThrow();
  });

  it("addressService.getAddresses fails closed when token is missing", async () => {
    await expect(addressService.getAddresses("usr-test-123", undefined)).rejects.toThrow();
  });

  it("checkoutService.processCheckout fails closed when token is missing", async () => {
    await expect(
      checkoutService.processCheckout({
        userId: "usr-test-123",
        paymentMethod: "cod",
        token: undefined,
      }),
    ).rejects.toThrow();
  });
});
