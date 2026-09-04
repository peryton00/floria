// Floria API — Operations Service
import { getAdminDb } from "../config/database.js";
import { orderRepository } from "../database/repositories/order.repository.js";
import { deliveryRepository } from "../database/repositories/delivery.repository.js";
import { auditRepository } from "../database/repositories/audit.repository.js";
import { Errors } from "../utils/errors.js";
import type { AuthenticatedUser } from "../middleware/auth.js";

export class OperationsService {
  async getDashboard() {
    const orders = await orderRepository.findAllMasterOrders();
    const deliveries = await deliveryRepository.findAll();

    let pendingPickup = 0;
    let packing = 0;
    let outForDelivery = 0;
    let delivered = 0;

    orders.forEach((o: any) => {
      const st = (o.status || "").toLowerCase();
      if (st === "ready for pickup" || st === "picked up") pendingPickup++;
      else if (st === "packing") packing++;
      else if (st === "out for delivery") outForDelivery++;
      else if (st === "delivered") delivered++;
    });

    return {
      pendingPickup,
      packing,
      outForDelivery,
      delivered,
      totalActiveDeliveries: deliveries.filter(
        (d: any) => d.status !== "delivered",
      ).length,
    };
  }

  async getOrders(status?: string, search?: string) {
    return orderRepository.findAllMasterOrders({ status, search });
  }

  async getOrderById(id: string) {
    const order = await orderRepository.findById(id);
    if (!order) throw Errors.notFound("Order");
    return order;
  }

  async updateOrderStatus(
    opUserId: string,
    orderId: string,
    newStatus: string,
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw Errors.notFound("Order");

    const currentStatus = order.status;

    // State machine transitions allowed for operations
    const allowedTransitions: Record<string, string> = {
      "picked up": "packing",
      packing: "out for delivery",
      "out for delivery": "delivered",
      picked_up: "packing",
      out_for_delivery: "delivered",
    };

    const normalizeCurrent = currentStatus.toLowerCase();
    const normalizeNext = newStatus.toLowerCase();

    if (allowedTransitions[normalizeCurrent] !== normalizeNext) {
      throw Errors.validation(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
      );
    }

    const success = await orderRepository.updateOrderStatus(
      orderId,
      normalizeNext,
    );
    if (!success) throw Errors.database("Failed to update order status");

    if (normalizeNext === "delivered") {
      try {
        const { ledgerService } = await import("../payments/ledger.service.js");
        await ledgerService.markOrderEarningsAvailable(orderId);
      } catch (lErr) {
        console.error(
          "[OperationsService] Failed to transition ledger state to available:",
          lErr,
        );
      }
    }

    await auditRepository.log({
      actor_user_id: opUserId,
      actor_role: "operations",
      action: "FULFILLMENT_STATUS_CHANGED",
      resource_type: "order",
      resource_id: orderId,
      metadata: { from: currentStatus, to: newStatus },
    });

    return orderRepository.findById(orderId);
  }

  // ── Pickups Queue ────────────────────────────────────────────────────────
  async getPickups(status?: string) {
    const orders = await orderRepository.findAllMasterOrders();
    let pickupOrders = orders.filter((o: any) => {
      const st = (o.status || "").toLowerCase();
      return (
        st === "ready for pickup" || st === "picked up" || st === "preparing"
      );
    });

    if (status && status !== "all") {
      pickupOrders = pickupOrders.filter(
        (o: any) => (o.status || "").toLowerCase() === status.toLowerCase(),
      );
    }

    return pickupOrders.map((o: any) => ({
      orderId: o.id,
      sellerId: o.seller_id,
      sellerName:
        o.order_items?.[0]?.seller?.business_name || "Partner Nursery",
      pickupAddress: o.delivery_address_snapshot?.city || "Nursery Location",
      itemsCount: o.order_items?.length || 0,
      status: o.status,
      createdAt: o.created_at,
    }));
  }

  async updatePickupStatus(
    opUserId: string,
    orderId: string,
    status: string,
    notes?: string,
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw Errors.notFound("Order");

    let action = "PICKUP_UPDATED";
    if (
      status.toLowerCase() === "picked up" ||
      status.toLowerCase() === "picked_up"
    ) {
      action = "PICKUP_COMPLETED";
    }

    await auditRepository.log({
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
  async getPackingTasks(status?: string) {
    const orders = await orderRepository.findAllMasterOrders();
    let packingOrders = orders.filter((o: any) => {
      const st = (o.status || "").toLowerCase();
      return st === "picked up" || st === "picked_up" || st === "packing";
    });

    if (status && status !== "all") {
      packingOrders = packingOrders.filter(
        (o: any) => (o.status || "").toLowerCase() === status.toLowerCase(),
      );
    }

    return packingOrders.map((o: any) => ({
      orderId: o.id,
      customerName: o.delivery_address_snapshot?.full_name || "Customer",
      items: o.order_items || [],
      status: o.status,
      createdAt: o.created_at,
    }));
  }

  async updatePackingTask(
    opUserId: string,
    orderId: string,
    status: string,
    verifiedItemsCount?: number,
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw Errors.notFound("Order");

    let action =
      status.toLowerCase() === "packing"
        ? "PACKING_STARTED"
        : "PACKING_COMPLETED";
    await auditRepository.log({
      actor_user_id: opUserId,
      actor_role: "operations",
      action,
      resource_type: "packing_task",
      resource_id: orderId,
      metadata: {
        from: order.status,
        to: status,
        verifiedItemsCount: verifiedItemsCount ?? null,
      },
    });

    return { orderId, status, verifiedItemsCount };
  }

  // ── Deliveries ─────────────────────────────────────────────────────────────
  async getDeliveries(status?: string, user?: AuthenticatedUser) {
    if (
      user &&
      (user.role === "delivery_partner" || user.role === "courier")
    ) {
      const partnerId = user.deliveryPartnerId || user.id;
      const { deliveryPartnerRepository } = await import(
        "../database/repositories/delivery-partner.repository.js"
      );
      return deliveryPartnerRepository.findPartnerDeliveries(partnerId, status);
    }
    return deliveryRepository.findAll(status);
  }

  async getDeliveryById(id: string, user?: AuthenticatedUser) {
    const delivery = await deliveryRepository.findById(id);
    if (!delivery) throw Errors.notFound("Delivery assignment");

    // Scoped courier isolation
    if (
      user &&
      (user.role === "delivery_partner" || user.role === "courier")
    ) {
      const partnerId = user.deliveryPartnerId || user.id;
      if (
        delivery.delivery_partner_id !== partnerId &&
        delivery.assigned_to !== user.id &&
        delivery.assigned_to !== partnerId
      ) {
        throw Errors.forbidden("You do not have permission to access this delivery.");
      }
    }

    return delivery;
  }

  async assignDelivery(
    opUserId: string,
    orderId: string,
    assignedTo: string,
    partnerId?: string,
  ) {
    const delivery = await deliveryRepository.assign({
      order_id: orderId,
      assigned_to: assignedTo,
      status: "assigned",
    });

    if (partnerId) {
      const adminDb = getAdminDb();
      await adminDb
        .from("delivery_assignments")
        .update({ delivery_partner_id: partnerId })
        .eq("id", delivery.id);
      delivery.delivery_partner_id = partnerId;
    }

    await auditRepository.log({
      actor_user_id: opUserId,
      actor_role: "operations",
      action: "DELIVERY_ASSIGNED",
      resource_type: "delivery_assignment",
      resource_id: delivery.id,
      metadata: { orderId, assignedTo, partnerId },
    });

    // P1: Dispatch notification to courier
    try {
      const { notificationService } = await import(
        "../notifications/notification.service.js"
      );
      const recipientUserId = partnerId || assignedTo;
      await notificationService.createNotification({
        user_id: recipientUserId,
        role: "operations",
        type: "DELIVERY_ASSIGNED",
        title: "New Delivery Assigned",
        message: `Order #${orderId.slice(0, 8).toUpperCase()} has been assigned to your route.`,
        source_type: "delivery_assignment",
        source_id: delivery.id,
        navigation: {
          entityType: "ORDER",
          entityId: orderId,
          action: "TRACK",
        },
      });
    } catch {
      // Async notification failure must not rollback assignment
    }

    return delivery;
  }

  async reassignDelivery(
    opUserId: string,
    deliveryId: string,
    assignedTo: string,
    partnerId?: string,
  ) {
    const delivery = await deliveryRepository.findById(deliveryId);
    if (!delivery) throw Errors.notFound("Delivery assignment");

    const adminDb = getAdminDb();
    const now = new Date().toISOString();
    const { data: updated, error } = await adminDb
      .from("delivery_assignments")
      .update({
        assigned_to: assignedTo,
        delivery_partner_id: partnerId || null,
        status: "assigned",
        assigned_at: now,
        updated_at: now,
      })
      .eq("id", deliveryId)
      .select()
      .maybeSingle();

    if (error || !updated) throw Errors.database("Failed to reassign delivery");

    await auditRepository.log({
      actor_user_id: opUserId,
      actor_role: "operations",
      action: "DELIVERY_REASSIGNED",
      resource_type: "delivery_assignment",
      resource_id: deliveryId,
      metadata: { from: delivery.assigned_to, to: assignedTo, partnerId },
    });

    return updated;
  }

  async updateDeliveryStatus(
    opUserId: string,
    deliveryId: string,
    status: string,
    user?: AuthenticatedUser,
  ) {
    const delivery = await deliveryRepository.findById(deliveryId);
    if (!delivery) throw Errors.notFound("Delivery assignment");

    // Courier ownership check
    if (
      user &&
      (user.role === "delivery_partner" || user.role === "courier")
    ) {
      const partnerId = user.deliveryPartnerId || user.id;
      if (
        delivery.delivery_partner_id !== partnerId &&
        delivery.assigned_to !== user.id &&
        delivery.assigned_to !== partnerId
      ) {
        throw Errors.forbidden("You are not assigned to update this delivery.");
      }
    }

    // State machine transition validation
    const current = delivery.status;
    const allowedTransitions: Record<string, string[]> = {
      assigned: ["picked_up"],
      picked_up: ["out_for_delivery"],
      out_for_delivery: ["delivered", "failed"],
      failed: ["out_for_delivery", "assigned"],
    };

    if (
      user?.role !== "admin" &&
      user?.role !== "super_admin" &&
      !allowedTransitions[current]?.includes(status)
    ) {
      throw Errors.invalidTransition(current, status);
    }

    const updated = await deliveryRepository.updateStatus(deliveryId, status);
    let action = "DELIVERY_STATUS_CHANGED";
    if (status === "out_for_delivery" || status === "out for delivery")
      action = "DELIVERY_STARTED";
    else if (status === "delivered") action = "DELIVERY_COMPLETED";
    else if (status === "failed") action = "DELIVERY_FAILED";

    // Order status synchronization
    if (delivery.order_id) {
      try {
        if (status === "picked_up") {
          await orderRepository.updateOrderStatus(delivery.order_id, "picked_up");
        } else if (status === "out_for_delivery") {
          await orderRepository.updateOrderStatus(
            delivery.order_id,
            "out_for_delivery",
          );
        }
      } catch (oErr: any) {
        console.warn(
          `[OperationsService] Order status sync notice for order '${delivery.order_id}':`,
          oErr.message,
        );
      }
    }

    await auditRepository.log({
      actor_user_id: opUserId,
      actor_role: user?.role || "operations",
      action,
      resource_type: "delivery_assignment",
      resource_id: deliveryId,
      metadata: { from: delivery.status, to: status },
    });

    return updated;
  }

  async completeDeliveryWithPod(
    user: AuthenticatedUser,
    deliveryId: string,
    podAssetId: string,
    recipientName?: string,
    notes?: string,
  ) {
    const adminDb = getAdminDb();

    // 1. Fetch delivery assignment
    const delivery = await deliveryRepository.findById(deliveryId);
    if (!delivery) throw Errors.notFound("Delivery assignment");

    // 2. Ownership / Role authorization
    const partnerId = user.deliveryPartnerId || user.id;
    if (
      delivery.assigned_to !== user.id &&
      delivery.assigned_to !== partnerId &&
      delivery.delivery_partner_id !== partnerId &&
      user.role !== "admin" &&
      user.role !== "super_admin"
    ) {
      throw Errors.forbidden("You are not assigned to complete this delivery.");
    }

    // 3. Idempotency Guard: If already delivered with the same POD asset, return existing delivery
    if (
      delivery.status === "delivered" &&
      delivery.pod_asset_id === podAssetId
    ) {
      return delivery;
    }

    // 4. Validate Delivery State Transition
    if (delivery.status === "delivered") {
      throw Errors.invalidTransition("delivered", "delivered");
    }
    if (delivery.status === "failed") {
      throw Errors.invalidTransition("failed", "delivered");
    }
    if (
      delivery.status !== "out_for_delivery" &&
      user.role !== "admin" &&
      user.role !== "super_admin"
    ) {
      throw Errors.invalidTransition(delivery.status, "delivered");
    }

    // 5. Load and Validate POD Media Asset
    if (!podAssetId) {
      throw Errors.validation(
        "A valid podAssetId is required to complete delivery.",
      );
    }

    const { data: asset, error: assetErr } = await adminDb
      .from("media_assets")
      .select("*")
      .eq("id", podAssetId)
      .maybeSingle();

    if (assetErr || !asset) {
      throw Errors.notFound("Proof of delivery media asset");
    }

    // Asset media_category check
    if (asset.media_category !== "DELIVERY_POD") {
      throw Errors.validation(
        "Media asset is not a valid Proof of Delivery (DELIVERY_POD) category.",
      );
    }

    // Asset ownership check
    if (
      asset.uploaded_by_user_id !== user.id &&
      user.role !== "admin" &&
      user.role !== "super_admin"
    ) {
      throw Errors.forbidden(
        "Cross-courier proof of delivery attachment is prohibited.",
      );
    }

    // Asset readiness check
    if (asset.status !== "READY") {
      throw Errors.validation(
        "POD media asset has not finished processing (status is not READY).",
      );
    }

    // Storage bucket check
    if (asset.storage_bucket !== "private-documents") {
      throw Errors.validation(
        "POD media asset must be stored in private-documents storage.",
      );
    }

    // 6. Complete delivery in database
    const updatedDelivery = await deliveryRepository.completeWithPod(
      deliveryId,
      podAssetId,
      recipientName,
      notes,
    );

    // 7. Update order status to delivered
    try {
      if (delivery.order_id) {
        await orderRepository.updateOrderStatus(delivery.order_id, "delivered");
        try {
          const { ledgerService } = await import("../payments/ledger.service.js");
          await ledgerService.markOrderEarningsAvailable(delivery.order_id);
        } catch {
          // Ledger fallback
        }
      }
    } catch (orderErr: any) {
      console.warn(
        `[OperationsService] Order status update notice for order '${delivery.order_id}':`,
        orderErr.message,
      );
    }

    // 8. Server-Authoritative Delivery Earning Generation (P1 Dynamic Rate Card)
    try {
      const targetPartnerId = delivery.delivery_partner_id || partnerId;
      if (targetPartnerId) {
        const { deliveryPartnerRepository } = await import(
          "../database/repositories/delivery-partner.repository.js"
        );
        const { deliveryRateCardService } = await import(
          "../delivery-partners/delivery-rate-card.service.js"
        );

        const calculation = await deliveryRateCardService.calculateDeliveryEarning(delivery);

        await deliveryPartnerRepository.createEarning({
          partner_id: targetPartnerId,
          delivery_id: deliveryId,
          order_id: delivery.order_id,
          base_earning_paise: calculation.base_earning_paise,
          extra_items_earning_paise: calculation.extra_items_earning_paise,
          total_earning_paise: calculation.total_earning_paise,
          status: "available",
          metadata: {
            recipientName: recipientName || null,
            podAssetId,
            rate_card_id: calculation.rate_card_id,
            rate_card_name: calculation.rate_card_name,
            currency: calculation.currency,
            calculated_at: calculation.calculated_at,
          },
        });
      }
    } catch (earnErr: any) {
      console.error(
        "[OperationsService] Delivery earning ledger error:",
        earnErr.message,
      );
    }

    // 9. Write audit log
    await auditRepository.log({
      actor_user_id: user.id,
      actor_role: user.role || "operations",
      action: "DELIVERY_COMPLETED",
      resource_type: "delivery_assignment",
      resource_id: deliveryId,
      metadata: {
        orderId: delivery.order_id,
        podAssetId,
        recipientName: recipientName || null,
        notes: notes || null,
        from: delivery.status,
        to: "delivered",
      },
    });

    return updatedDelivery;
  }

  async getDeliveryPod(user: AuthenticatedUser, deliveryId: string) {
    const adminDb = getAdminDb();

    // 1. Fetch delivery assignment
    const delivery = await deliveryRepository.findById(deliveryId);
    if (!delivery) throw Errors.notFound("Delivery assignment");

    // 2. Authorization check
    if (
      delivery.assigned_to !== user.id &&
      user.role !== "admin" &&
      user.role !== "super_admin" &&
      user.role !== "operations"
    ) {
      throw Errors.forbidden(
        "You do not have permission to view proof of delivery for this assignment.",
      );
    }

    if (!delivery.pod_asset_id) {
      throw Errors.notFound(
        "Proof of delivery has not been uploaded for this delivery.",
      );
    }

    // 3. Fetch asset record
    const { data: asset, error: assetErr } = await adminDb
      .from("media_assets")
      .select("*")
      .eq("id", delivery.pod_asset_id)
      .maybeSingle();

    if (assetErr || !asset) {
      throw Errors.notFound("Proof of delivery media asset record");
    }

    // 4. Generate signed URL from private-documents (valid 1 hour / 3600 seconds)
    const storagePath =
      asset.original_path ||
      `pod/${asset.uploaded_by_user_id}/${asset.id}.webp`;
    const { data: signed, error: signErr } = await adminDb.storage
      .from("private-documents")
      .createSignedUrl(storagePath, 3600);

    if (signErr || !signed?.signedUrl) {
      throw Errors.database(
        `Failed to generate signed URL for POD: ${signErr?.message || "unknown"}`,
      );
    }

    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return {
      signedUrl: signed.signedUrl,
      expiresAt,
      assetId: asset.id,
      recipientName: delivery.recipient_name || null,
      notes: delivery.pod_notes || null,
      deliveredAt: delivery.delivered_at || null,
    };
  }
}

export const operationsService = new OperationsService();
