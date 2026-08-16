"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutService = exports.CheckoutService = void 0;
// Floria API — Checkout Service
const database_js_1 = require("../config/database.js");
const order_repository_js_1 = require("../database/repositories/order.repository.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const errors_js_1 = require("../utils/errors.js");
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
            .select("product_id, base_price_paise, price_paise, stock_quantity")
            .in("product_id", productIds);
        if (!products || products.length === 0) {
            throw errors_js_1.Errors.validation("No active products in cart.");
        }
        const productMap = new Map(products.map((p) => [p.id, p]));
        const invMap = new Map((inventories || []).map((i) => [i.product_id, i]));
        const { pricingService } = await import("../pricing/pricing.service.js");
        const finSettings = await pricingService.getFinancialSettings();
        const lineItems = [];
        let allItemsFreeDeliveryEligible = true;
        for (const item of cartItems) {
            const p = productMap.get(item.product_id);
            const inv = invMap.get(item.product_id);
            if (!p || !inv)
                throw errors_js_1.Errors.validation("Cart contains invalid or inactive product.");
            if (inv.stock_quantity < item.quantity)
                throw errors_js_1.Errors.outOfStock(p.name);
            const rawBase = inv.base_price_paise ?? inv.price_paise ?? 0;
            const calc = await pricingService.calculateProductPricing(rawBase, finSettings);
            if (!calc.isFreeDeliveryEligible) {
                allItemsFreeDeliveryEligible = false;
            }
            lineItems.push({
                product_id: p.id,
                product_name_snapshot: p.name,
                seller_id_snapshot: p.seller_id,
                base_price_paise_snapshot: calc.sellerBasePricePaise,
                floria_profit_rate_snapshot: calc.floriaProfitRate / 100.0,
                floria_profit_paise_snapshot: calc.floriaProfitPaise,
                delivery_recovery_paise_snapshot: calc.deliveryRecoveryPaise,
                customer_price_paise_snapshot: calc.customerProductPricePaise,
                is_free_delivery_eligible_snapshot: calc.isFreeDeliveryEligible,
                unit_price_paise_snapshot: calc.customerProductPricePaise,
                quantity: item.quantity,
                line_total_paise: calc.customerProductPricePaise * item.quantity,
                commission_rate_snapshot: calc.sellerCommissionRate / 100.0,
                commission_paise_snapshot: calc.sellerCommissionPaise,
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
        const maintenanceFeePaise = finSettings.platformMaintenanceFeePaise; // ₹10.00 default
        // Server-authoritative delivery fee calculation (Product-level free delivery rule)
        const { deliveryService } = await import("../delivery/delivery.service.js");
        const deliverySettings = await deliveryService.getDeliverySettings();
        let deliveryFeePaise = 0;
        let deliveryFeeReason = "FREE_DELIVERY_THRESHOLD";
        if (!deliverySettings.deliveryEnabled) {
            deliveryFeePaise = 0;
            deliveryFeeReason = "DELIVERY_DISABLED";
        }
        else if (deliverySettings.freeDeliveryEnabled && allItemsFreeDeliveryEligible) {
            deliveryFeePaise = 0;
            deliveryFeeReason = "FREE_DELIVERY_THRESHOLD";
        }
        else {
            deliveryFeePaise = deliverySettings.baseDeliveryFeePaise; // ₹40.00 default
            deliveryFeeReason = "PAID_BELOW_THRESHOLD";
        }
        const finalTotalPaise = subtotalPaise + maintenanceFeePaise + deliveryFeePaise;
        const ratePct = finSettings.sellerCommissionRate;
        const commissionDecimalRate = ratePct / 100.0;
        const sellerBaseSubtotal = lineItems.reduce((s, li) => s + (li.base_price_paise_snapshot * li.quantity), 0);
        const commissionPaise = Math.round(sellerBaseSubtotal * commissionDecimalRate);
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
            maintenance_fee_paise: maintenanceFeePaise,
            delivery_fee_paise: deliveryFeePaise,
            delivery_fee_reason: deliveryFeeReason,
            delivery_threshold_paise_snapshot: finSettings.freeDeliveryThresholdPaise,
            eligible_delivery_subtotal_paise: subtotalPaise,
            commission_rate: commissionDecimalRate,
            commission_paise: commissionPaise,
            total_paise: finalTotalPaise,
            notes: input.paymentMethod === "cod" ? "COD" : "Online",
        };
        // 5. Create Order & Items
        const orderId = await order_repository_js_1.orderRepository.createOrder(orderPayload, lineItems, fulfillments);
        // 5b. Save Multi-Nursery Financial Attribution & Seller Ledger Entries
        try {
            const { PaymentProviderFactory } = await import("../payments/payment.provider.js");
            const provider = PaymentProviderFactory.getProvider(input.paymentMethod);
            const paymentIntent = await provider.createPaymentIntent({
                masterOrderId: orderId,
                customerId: input.userId,
                amountPaise: subtotalPaise,
            });
            // Insert Payments Record
            const { data: paymentRow } = await db.from("payments").insert({
                order_id: orderId,
                customer_id: input.userId,
                payment_reference: paymentIntent.paymentReference,
                provider: input.paymentMethod,
                currency: "INR",
                amount_paise: subtotalPaise,
                status: paymentIntent.status,
                raw_provider_response: paymentIntent.rawProviderResponse,
            }).select().maybeSingle();
            const paymentId = paymentRow?.id;
            // Per-seller financial attribution & ledger credit
            for (const sellerId of uniqueSellers) {
                const sellerItems = lineItems.filter((li) => li.seller_id_snapshot === sellerId);
                const sellerGrossPaise = sellerItems.reduce((s, li) => s + li.line_total_paise, 0);
                const sellerCommissionPaise = Math.round(sellerGrossPaise * commissionDecimalRate);
                const sellerNetPaise = sellerGrossPaise - sellerCommissionPaise;
                // Upsert seller_order_financials snapshot
                await db.from("seller_order_financials").upsert({
                    order_id: orderId,
                    seller_id: sellerId,
                    seller_gross_paise: sellerGrossPaise,
                    commission_rate: commissionDecimalRate,
                    commission_paise: sellerCommissionPaise,
                    seller_net_paise: sellerNetPaise,
                }, { onConflict: "order_id,seller_id" });
                // Append to seller_ledger_entries (pending balance state until delivered)
                await db.from("seller_ledger_entries").insert({
                    seller_id: sellerId,
                    order_id: orderId,
                    payment_id: paymentId,
                    entry_type: "earning_credit",
                    amount_paise: sellerNetPaise,
                    balance_state: "pending",
                    description: `Earnings for order #${orderId.slice(0, 8)} (Gross ₹${(sellerGrossPaise / 100).toFixed(2)}, Comm ₹${(sellerCommissionPaise / 100).toFixed(2)})`,
                });
            }
        }
        catch (finErr) {
            console.warn("[CheckoutService] Financial ledger / payment creation warning:", finErr);
        }
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
        // 8. Notifications Integration
        try {
            const { notificationService } = await import("../notifications/notification.service.js");
            // Customer notification
            await notificationService.createNotification({
                user_id: input.userId,
                role: "customer",
                type: "ORDER_PLACED",
                title: "Order Placed Successfully",
                message: `Your order #${orderId.slice(0, 8)} has been placed and routed to nursery partners.`,
                data: { orderId },
                source_type: "order",
                source_id: orderId,
            });
            // Seller notifications for each nursery in the order
            for (const sId of uniqueSellers) {
                let sellerUserId = null;
                const { data: sellerProf } = await db
                    .from("seller_profiles")
                    .select("user_id")
                    .or(`id.eq.${sId},user_id.eq.${sId}`)
                    .maybeSingle();
                if (sellerProf?.user_id) {
                    sellerUserId = sellerProf.user_id;
                }
                if (sellerUserId) {
                    await notificationService.createNotification({
                        user_id: sellerUserId,
                        role: "seller",
                        type: "NEW_ORDER",
                        title: "New Nursery Order Received",
                        message: `You have received a new order item on order #${orderId.slice(0, 8)}.`,
                        data: { orderId, sellerId: sId },
                        source_type: "order",
                        source_id: orderId,
                    });
                }
                else {
                    // Fallback: Notify all registered seller accounts for seed/test products
                    const { data: allSellers } = await db
                        .from("seller_profiles")
                        .select("user_id");
                    for (const s of allSellers || []) {
                        if (s.user_id) {
                            await notificationService.createNotification({
                                user_id: s.user_id,
                                role: "seller",
                                type: "NEW_ORDER",
                                title: "New Nursery Order Received",
                                message: `You have received a new order item on order #${orderId.slice(0, 8)}.`,
                                data: { orderId, sellerId: sId },
                                source_type: "order",
                                source_id: orderId,
                            });
                        }
                    }
                }
            }
        }
        catch (notifErr) {
            console.error("[CheckoutService] Notification trigger error:", notifErr);
        }
        return { orderId };
    }
}
exports.CheckoutService = CheckoutService;
exports.checkoutService = new CheckoutService();
