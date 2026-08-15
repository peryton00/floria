// Floria API — Cart Service
import { getAdminDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";

export class CartService {
  async getCart(userId: string) {
    const db = getAdminDb();
    const { data: cart } = await db
      .from("carts")
      .select("*, cart_items(*, product:products(*, inventory(*), images:product_images(*)))")
      .eq("user_id", userId)
      .maybeSingle();

    return cart || { user_id: userId, cart_items: [] };
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const db = getAdminDb();

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
        .insert({ user_id: userId, seller_id: product.seller_id })
        .select("id")
        .single();
      if (cartErr) throw Errors.database("Failed to create cart.");
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
      .upsert({ cart_id: cart.id, product_id: productId, quantity: newQty }, { onConflict: "cart_id,product_id" });

    if (itemErr) throw Errors.database("Failed to update cart item.");

    return this.getCart(userId);
  }

  async updateQuantity(userId: string, productId: string, quantity: number) {
    const db = getAdminDb();

    const { data: cart } = await db
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!cart) throw Errors.notFound("Cart");

    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }

    const { error } = await db
      .from("cart_items")
      .update({ quantity })
      .eq("cart_id", cart.id)
      .eq("product_id", productId);

    if (error) throw Errors.database("Failed to update item quantity.");

    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string) {
    const db = getAdminDb();

    const { data: cart } = await db
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!cart) return this.getCart(userId);

    await db
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id)
      .eq("product_id", productId);

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const db = getAdminDb();

    const { data: cart } = await db
      .from("carts")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (cart) {
      await db.from("cart_items").delete().eq("cart_id", cart.id);
    }

    return this.getCart(userId);
  }

  async mergeCart(userId: string, items: Array<{ productId: string; quantity: number }>) {
    for (const item of items) {
      try {
        await this.addItem(userId, item.productId, item.quantity);
      } catch (e) {
        // Skip items that are out of stock or inactive
      }
    }
    return this.getCart(userId);
  }
}

export const cartService = new CartService();
