// Floria API — Cart Service
import { getAdminDb, getDbForUser } from "../config/database.js";
import { Errors } from "../utils/errors.js";
import { productsService } from "../products/products.service.js";
import { pricingService } from "../pricing/pricing.service.js";

export class CartService {
  async getCart(userId: string, token?: string) {
    const db = getDbForUser(token);
    const { data: cart } = await db
      .from("carts")
      .select(
        "*, cart_items(*, product:products(*, inventory(*), images:product_images(*)))",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (!cart) {
      return { user_id: userId, cart_items: [] };
    }

    const settings = await pricingService.getFinancialSettings();
    let overrideMap = new Map<string, any>();
    try {
      const { data: overrides } = await db
        .from("product_pricing_overrides")
        .select("product_id, custom_customer_price_paise")
        .eq("is_active", true);
      if (overrides) {
        overrideMap = new Map(overrides.map((o: any) => [o.product_id, o]));
      }
    } catch {}

    if (cart.cart_items && Array.isArray(cart.cart_items)) {
      cart.cart_items = cart.cart_items.map((ci: any) => {
        if (ci.product) {
          ci.product = productsService.enrichWithDbPricing(
            ci.product,
            settings,
            overrideMap,
          );
        }
        return ci;
      });
    }

    return cart;
  }

  async addItem(userId: string, productId: string, quantity: number, token?: string) {
    const db = getDbForUser(token);

    const { data: product } = await db
      .from("products")
      .select("id, name, seller_id, status")
      .eq("id", productId)
      .maybeSingle();

    if (!product || product.status !== "active") {
      throw Errors.notFound("Active product");
    }

    const { data: inv } = await db
      .from("inventory")
      .select("stock_quantity")
      .eq("product_id", productId)
      .maybeSingle();

    if (!inv || inv.stock_quantity < quantity) {
      throw Errors.outOfStock(product.name);
    }

    let { data: cart } = await db
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!cart) {
      const { data: newCart, error: cartErr } = await db
        .from("carts")
        .insert({ user_id: userId })
        .select("id")
        .single();
      if (cartErr) {
        console.error("[CartService.addItem] cart creation error:", cartErr);
        throw Errors.database("Failed to create cart.");
      }
      cart = newCart;
    }

    // Check existing item
    const { data: existingItem } = await db
      .from("cart_items")
      .select("quantity")
      .eq("cart_id", cart.id)
      .eq("product_id", productId)
      .maybeSingle();

    const newQty = existingItem ? existingItem.quantity + quantity : quantity;

    const { error: itemErr } = await db
      .from("cart_items")
      .upsert(
        { cart_id: cart.id, product_id: productId, quantity: newQty },
        { onConflict: "cart_id,product_id" },
      );

    if (itemErr) {
      console.error("[CartService.addItem] item upsert error:", itemErr);
      throw Errors.database("Failed to update cart item.");
    }

    return this.getCart(userId, token);
  }

  async updateQuantity(userId: string, productId: string, quantity: number, token?: string) {
    const db = getDbForUser(token);

    const { data: cart } = await db
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!cart) throw Errors.notFound("Cart");

    if (quantity <= 0) {
      return this.removeItem(userId, productId, token);
    }

    const { error } = await db
      .from("cart_items")
      .update({ quantity })
      .eq("cart_id", cart.id)
      .eq("product_id", productId);

    if (error) throw Errors.database("Failed to update item quantity.");

    return this.getCart(userId, token);
  }

  async removeItem(userId: string, productId: string, token?: string) {
    const db = getDbForUser(token);

    const { data: cart } = await db
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!cart) return this.getCart(userId, token);

    await db
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id)
      .eq("product_id", productId);

    return this.getCart(userId, token);
  }

  async clearCart(userId: string, token?: string) {
    const db = getDbForUser(token);

    const { data: cart } = await db
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (cart) {
      await db.from("cart_items").delete().eq("cart_id", cart.id);
    }

    return this.getCart(userId, token);
  }

  async mergeCart(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    token?: string,
  ) {
    for (const item of items) {
      try {
        await this.addItem(userId, item.productId, item.quantity, token);
      } catch (e) {
        // Skip items that are out of stock or inactive
      }
    }
    return this.getCart(userId, token);
  }
}

export const cartService = new CartService();
