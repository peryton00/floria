// Floria API — Wishlist Service
import { getAdminDb } from "../config/database.js";
import { Errors } from "../utils/errors.js";

export class WishlistService {
  async getWishlist(userId: string) {
    const db = getAdminDb();
    const { data: wishlist } = await db
      .from("wishlists")
      .select("*, wishlist_items(*, product:products(*, inventory(*), images:product_images(*)))")
      .eq("user_id", userId)
      .maybeSingle();

    return wishlist || { user_id: userId, wishlist_items: [] };
  }

  async addItem(userId: string, productId: string) {
    const db = getAdminDb();

    let { data: wishlist } = await db
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!wishlist) {
      const { data: newWishlist, error: wErr } = await db
        .from("wishlists")
        .insert({ user_id: userId })
        .select("id")
        .single();
      if (wErr) throw Errors.database("Failed to create wishlist.");
      wishlist = newWishlist;
    }

    const { error } = await db
      .from("wishlist_items")
      .upsert({ wishlist_id: wishlist.id, product_id: productId }, { onConflict: "wishlist_id,product_id" });

    if (error) throw Errors.database("Failed to add item to wishlist.");

    return this.getWishlist(userId);
  }

  async removeItem(userId: string, productId: string) {
    const db = getAdminDb();

    const { data: wishlist } = await db
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (wishlist) {
      await db
        .from("wishlist_items")
        .delete()
        .eq("wishlist_id", wishlist.id)
        .eq("product_id", productId);
    }

    return this.getWishlist(userId);
  }

  async mergeWishlist(userId: string, productIds: string[]) {
    for (const pid of productIds) {
      try {
        await this.addItem(userId, pid);
      } catch (e) {
        // Ignore errors
      }
    }
    return this.getWishlist(userId);
  }
}

export const wishlistService = new WishlistService();
