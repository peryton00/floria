"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationsService = exports.OperationsService = void 0;
// Floria API — Operations Service
const order_repository_js_1 = require("../database/repositories/order.repository.js");
const delivery_repository_js_1 = require("../database/repositories/delivery.repository.js");
const audit_repository_js_1 = require("../database/repositories/audit.repository.js");
const errors_js_1 = require("../utils/errors.js");
class OperationsService {
    async getDashboard() {
        const orders = await order_repository_js_1.orderRepository.findAllMasterOrders();
        const deliveries = await delivery_repository_js_1.deliveryRepository.findAll();
        let pendingPickup = 0;
        let packing = 0;
        let outForDelivery = 0;
        let delivered = 0;
        orders.forEach((o) => {
            const st = (o.status || "").toLowerCase();
            if (st === "ready for pickup" || st === "picked up")
                pendingPickup++;
            else if (st === "packing")
                packing++;
            else if (st === "out for delivery")
                outForDelivery++;
            else if (st === "delivered")
                delivered++;
        });
        return {
            pendingPickup,
            packing,
            outForDelivery,
            delivered,
            totalActiveDeliveries: deliveries.filter((d) => d.status !== "delivered").length,
        };
    }
    async getOrders(status, search) {
        return order_repository_js_1.orderRepository.findAllMasterOrders({ status, search });
    }
    async getOrderById(id) {
        const order = await order_repository_js_1.orderRepository.findById(id);
        if (!order)
            throw errors_js_1.Errors.notFound("Order");
        return order;
    }
    async updateOrderStatus(opUserId, orderId, newStatus) {
        const order = await order_repository_js_1.orderRepository.findById(orderId);
        if (!order)
            throw errors_js_1.Errors.notFound("Order");
        const currentStatus = order.status;
        // State machine transitions allowed for operations
        const allowedTransitions = {
            "picked up": "packing",
            "packing": "out for delivery",
            "out for delivery": "delivered",
            "picked_up": "packing",
            "out_for_delivery": "delivered",
        };
        const normalizeCurrent = currentStatus.toLowerCase();
        const normalizeNext = newStatus.toLowerCase();
        if (allowedTransitions[normalizeCurrent] !== normalizeNext) {
            throw errors_js_1.Errors.validation(`Invalid status transition from '${currentStatus}' to '${newStatus}'`);
        }
        const success = await order_repository_js_1.orderRepository.updateOrderStatus(orderId, normalizeNext);
        if (!success)
            throw errors_js_1.Errors.database("Failed to update order status");
        if (normalizeNext === "delivered") {
            try {
                const { ledgerService } = await import("../payments/ledger.service.js");
                await ledgerService.markOrderEarningsAvailable(orderId);
            }
            catch (lErr) {
                console.error("[OperationsService] Failed to transition ledger state to available:", lErr);
            }
        }
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: opUserId,
            actor_role: "operations",
            action: "FULFILLMENT_STATUS_CHANGED",
            resource_type: "order",
            resource_id: orderId,
            metadata: { from: currentStatus, to: newStatus },
        });
        return order_repository_js_1.orderRepository.findById(orderId);
    }
    // ── Pickups Queue ────────────────────────────────────────────────────────
    async getPickups(status) {
        const orders = await order_repository_js_1.orderRepository.findAllMasterOrders();
        let pickupOrders = orders.filter((o) => {
            const st = (o.status || "").toLowerCase();
            return st === "ready for pickup" || st === "picked up" || st === "preparing";
        });
        if (status && status !== "all") {
            pickupOrders = pickupOrders.filter((o) => (o.status || "").toLowerCase() === status.toLowerCase());
        }
        return pickupOrders.map((o) => ({
            orderId: o.id,
            sellerId: o.seller_id,
            sellerName: o.order_items?.[0]?.seller?.business_name || "Partner Nursery",
            pickupAddress: o.delivery_address_snapshot?.city || "Nursery Location",
            itemsCount: o.order_items?.length || 0,
            status: o.status,
            createdAt: o.created_at,
        }));
    }
    async updatePickupStatus(opUserId, orderId, status, notes) {
        const order = await order_repository_js_1.orderRepository.findById(orderId);
        if (!order)
            throw errors_js_1.Errors.notFound("Order");
        let action = "PICKUP_UPDATED";
        if (status.toLowerCase() === "picked up" || status.toLowerCase() === "picked_up") {
            action = "PICKUP_COMPLETED";
        }
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: opUserId,
            actor_role: "operations",
            action,
            resource_type: "pickup",
            resource_id: orderId,
            metadata: { from: order.status, to: status, notes: notes || null },
        });
        return { orderId, status, notes };
    }
    // ── Packing Queue ────────────────────────────────────────────────────────
    async getPackingTasks(status) {
        const orders = await order_repository_js_1.orderRepository.findAllMasterOrders();
        let packingOrders = orders.filter((o) => {
            const st = (o.status || "").toLowerCase();
            return st === "picked up" || st === "picked_up" || st === "packing";
        });
        if (status && status !== "all") {
            packingOrders = packingOrders.filter((o) => (o.status || "").toLowerCase() === status.toLowerCase());
        }
        return packingOrders.map((o) => ({
            orderId: o.id,
            customerName: o.delivery_address_snapshot?.full_name || "Customer",
            items: o.order_items || [],
            status: o.status,
            createdAt: o.created_at,
        }));
    }
    async updatePackingTask(opUserId, orderId, status, verifiedItemsCount) {
        const order = await order_repository_js_1.orderRepository.findById(orderId);
        if (!order)
            throw errors_js_1.Errors.notFound("Order");
        let action = status.toLowerCase() === "packing" ? "PACKING_STARTED" : "PACKING_COMPLETED";
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: opUserId,
            actor_role: "operations",
            action,
            resource_type: "packing_task",
            resource_id: orderId,
            metadata: { from: order.status, to: status, verifiedItemsCount: verifiedItemsCount ?? null },
        });
        return { orderId, status, verifiedItemsCount };
    }
    // ── Deliveries ─────────────────────────────────────────────────────────────
    async getDeliveries(status) {
        return delivery_repository_js_1.deliveryRepository.findAll(status);
    }
    async getDeliveryById(id) {
        const delivery = await delivery_repository_js_1.deliveryRepository.findById(id);
        if (!delivery)
            throw errors_js_1.Errors.notFound("Delivery assignment");
        return delivery;
    }
    async assignDelivery(opUserId, orderId, assignedTo) {
        const delivery = await delivery_repository_js_1.deliveryRepository.assign({
            order_id: orderId,
            assigned_to: assignedTo,
            status: "assigned",
        });
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: opUserId,
            actor_role: "operations",
            action: "DELIVERY_ASSIGNED",
            resource_type: "delivery_assignment",
            resource_id: delivery.id,
            metadata: { orderId, assignedTo },
        });
        return delivery;
    }
    async reassignDelivery(opUserId, deliveryId, assignedTo) {
        const delivery = await delivery_repository_js_1.deliveryRepository.findById(deliveryId);
        if (!delivery)
            throw errors_js_1.Errors.notFound("Delivery assignment");
        const updated = await delivery_repository_js_1.deliveryRepository.assign({
            order_id: delivery.order_id,
            assigned_to: assignedTo,
            status: "reassigned",
        });
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: opUserId,
            actor_role: "operations",
            action: "DELIVERY_REASSIGNED",
            resource_type: "delivery_assignment",
            resource_id: deliveryId,
            metadata: { from: delivery.assigned_to, to: assignedTo },
        });
        return updated;
    }
    async updateDeliveryStatus(opUserId, deliveryId, status) {
        const delivery = await delivery_repository_js_1.deliveryRepository.findById(deliveryId);
        if (!delivery)
            throw errors_js_1.Errors.notFound("Delivery assignment");
        const updated = await delivery_repository_js_1.deliveryRepository.updateStatus(deliveryId, status);
        let action = "DELIVERY_STATUS_CHANGED";
        if (status === "out_for_delivery" || status === "out for delivery")
            action = "DELIVERY_STARTED";
        else if (status === "delivered")
            action = "DELIVERY_COMPLETED";
        else if (status === "failed")
            action = "DELIVERY_FAILED";
        await audit_repository_js_1.auditRepository.log({
            actor_user_id: opUserId,
            actor_role: "operations",
            action,
            resource_type: "delivery_assignment",
            resource_id: deliveryId,
            metadata: { from: delivery.status, to: status },
        });
        return updated;
    }
}
exports.OperationsService = OperationsService;
exports.operationsService = new OperationsService();
