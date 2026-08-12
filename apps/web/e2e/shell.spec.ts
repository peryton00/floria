import { test, expect } from "@playwright/test";

// Phase 0 smoke tests — verifies the customer shell loads and nav is visible.
// Expand into full E2E flows as features are implemented.

test.describe("Customer shell", () => {
  test("home page loads and shows Floria wordmark", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Floria/i);
    await expect(page.getByText("Floria").first()).toBeVisible();
  });

  test("hero section is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/nature/i);
  });

  test("no horizontal overflow at mobile widths", async ({ page, viewport }) => {
    await page.goto("/");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = viewport?.width ?? 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test("bottom nav is visible on mobile", async ({ page, viewport }) => {
    if ((viewport?.width ?? 1440) >= 768) test.skip();
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    await expect(nav).toBeVisible();
  });

  test("cart link is in header", async ({ page }) => {
    await page.goto("/");
    const cartLink = page.getByRole("link", { name: /cart/i });
    await expect(cartLink).toBeVisible();
  });

  test("categories page loads", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/categories/i);
  });

  test("orders page loads", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/orders/i);
  });
});
