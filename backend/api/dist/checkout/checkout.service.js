"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutService = exports.CheckoutService = void 0;
// Floria API — Checkout Service
const database_js_1 = require("../config/database.js");
const order_repository_js_1 = require("../database/repositories/order.repository.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const errors_js_1 = require("../utils/errors.js");
const constants_js_1 = require("../config/constants.js");
class CheckoutService {
    async processCheckout(input) {
        const db = (0, database_js_1.getAdminDb)();
        // 1. Resolve Delivery Address from DB (never trust browser address snapshot directly if addressId given)
        let deliveryAddress = null;
        if (input.addressId) {
            const { data: addr } = await db
                .from("addresses")
                .select("*")
                .eq("id", input.addressId)
                .eq("user_id", input.userId)
                .maybeSingle();
            if (addr) {
                deliveryAddress = addr;
            }
        }
        if (!deliveryAddress && input.address) {
            deliveryAddress = input.address;
        }
        if (!deliveryAddress) {
            throw errors_js_1.Errors.validation("A valid delivery address is required for checkout.");
        }
        // 2. Fetch cart items from DB
        const { data: cartRow } = await db
            .from("carts")
            .select("id")
            .eq("user_id", input.userId)
            .maybeSingle();
        if (!cartRow)
            throw errors_js_1.Errors.validation("Your cart is empty.");
        const { data: cartItems } = await db
            .from("cart_items")
            .select("product_id, quantity")
            .eq("cart_id", cartRow.id);
        if (!cartItems || cartItems.length === 0) {
            throw errors_js_1.Errors.validation("Your cart is empty.");
        }
        const productIds = cartItems.map((ci) => ci.product_id);
        // 3. Server-authoritative product & inventory lookup
        const { data: products } = await db
            .from("products")
            .select("id, name, seller_id, status")
            .in("id", productIds)
            .eq("status", "active");
        const { data: inventories } = await db
            .from("inventory")
            .select("product_id, price_paise, stock_quantity")
            .in("product_id", productIds);
        if (!products || products.length === 0) {
            throw errors_js_1.Errors.validation("No active products in cart.");
        }
        const productMap = new Map(products.map((p) => [p.id, p]));
        const invMap = new Map((inventories || []).map((i) => [i.product_id, i]));
        const lineItems = [];
        for (const item of cartItems) {
            const p = productMap.get(item.product_id);
            const inv = invMap.get(item.product_id);
            if (!p || !inv)
                throw errors_js_1.Errors.validation("Cart contains invalid or inactive product.");
            if (inv.stock_quantity < item.quantity)
                throw errors_js_1.Errors.outOfStock(p.name);
            lineItems.push({
                product_id: p.id,
                product_name_snapshot: p.name,
                seller_id_snapshot: p.seller_id,
                unit_price_paise_snapshot: inv.price_paise,
                quantity: item.quantity,
                line_total_paise: inv.price_paise * item.quantity,
            });
        }
        // 4. Atomic Inventory Deduction (Oversale & Concurrency Protection)
        for (const li of lineItems) {
            const currentInv = invMap.get(li.product_id);
            const newStock = (currentInv?.stock_quantity ?? 0) - li.quantity;
            if (newStock < 0) {
                throw errors_js_1.Errors.outOfStock(li.product_name_snapshot);
            }
            const { data: updatedInv, error: invErr } = await db
                .from("inventory")
                .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
                .eq("product_id", li.product_id)
                .gte("stock_quantity", li.quantity)
                .select();
            if (invErr || !updatedInv || updatedInv.length === 0) {
                throw errors_js_1.Errors.outOfStock(li.product_name_snapshot);
            }
        }
        const subtotalPaise = lineItems.reduce((s, li) => s + li.line_total_paise, 0);
        const commissionPaise = Math.round(subtotalPaise * constants_js_1.PLATFORM_COMMISSION_RATE);
        const primarySellerId = lineItems[0].seller_id_snapshot;
        const uniqueSellers = [...new Set(lineItems.map((li) => li.seller_id_snapshot))];
        const fulfillments = uniqueSellers.map((sellerId) => ({
            seller_id: sellerId,
            status: "Order Placed",
        }));
        const orderPayload = {
            customer_id: input.userId,
            seller_id: primarySellerId,
            status: "seller_pending",
            delivery_address_snapshot: deliveryAddress,
            subtotal_paise: subtotalPaise,
            delivery_fee_paise: 0,
            commission_rate: constants_js_1.PLATFORM_COMMISSION_RATE,
            commission_paise: commissionPaise,
            total_paise: subtotalPaise,
            notes: input.paymentMethod === "cod" ? "COD" : "Online",
        };
        // 5. Create Order & Items
        const orderId = await order_repository_js_1.orderRepository.createOrder(orderPayload, lineItems, fulfillments);
        // 6. Clear Cart
        await db.from("cart_items").delete().eq("cart_id", cartRow.id);
        // 7. Audit Log
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: input.userId,
            actor_role: "customer",
            action: "ORDER_CREATED",
            resource_type: "order",
            resource_id: orderId,
            metadata: { subtotalPaise, sellerCount: uniqueSellers.length, paymentMethod: input.paymentMethod },
        });
        return { orderId };
    }
}
exports.CheckoutService = CheckoutService;
exports.checkoutService = new CheckoutService();
