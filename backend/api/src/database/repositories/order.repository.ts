// Floria API — Order Repository
import { getAdminDb } from "../../config/database.js";

export class OrderRepository {
  async findByCustomerId(customerId: string): Promise<any[]> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("orders")
      .select(
        "*, order_items(*, product:products(id,name,slug)), seller_order_fulfillments(*)",
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data;
  }

  async findById(orderId: string): Promise<any | null> {
    const db = getAdminDb();
    const { data, error } = await db
      .from("orders")
      .select(
        "*, order_items(*, product:products(id,name,slug)), seller_order_fulfillments(*)",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  }

  async findAllMasterOrders(filters?: {
    status?: string;
    search?: string;
  }): Promise<any[]> {
    const db = getAdminDb();
    let q = db
      .from("orders")
      .select(
        `
        *,
        order_items(
          *,
          product:products(
            id,
            name,
            slug
          )
        ),
        seller_order_fulfillments(*)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      q = q.eq("status", filters.status.toLowerCase());
    }

    const { data, error } = await q;
    if (error || !data) return [];

    let results = data;
    if (filters?.search) {
      const queryStr = filters.search.toLowerCase();
      results = results.filter(
        (o: any) =>
          o.id.toLowerCase().includes(queryStr) ||
          (o.delivery_address_snapshot?.full_name || "")
            .toLowerCase()
            .includes(queryStr),
      );
    }
    return results;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    const db = getAdminDb();
    const masterStatus = status.toLowerCase().replace(/ /g, "_");

    const { error } = await db
      .from("orders")
      .update({ status: masterStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) return false;

    const displayStatusMap: Record<string, string> = {
      pending_payment: "Pending Payment",
      order_placed: "Order Placed",
      seller_pending: "Order Placed",
      nursery_confirmed: "Nursery Confirmed",
      preparing: "Preparing",
      ready_for_pickup: "Ready for Pickup",
      picked_up: "Picked Up",
      packing: "Packing",
      out_for_delivery: "Out for Delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    const displayStatus = displayStatusMap[masterStatus] || status;

    await db
      .from("seller_order_fulfillments")
      .update({ status: displayStatus, updated_at: new Date().toISOString() })
      .eq("order_id", orderId);

    return true;
  }

  async createOrder(
    orderPayload: any,
    lineItems: any[],
    fulfillments: any[],
  ): Promise<string> {
    const db = getAdminDb();
    const { data: order, error: orderErr } = await db
      .from("orders")
      .insert(orderPayload)
      .select("id")
      .single();

    if (orderErr || !order) {
      throw new Error(`Order insertion failed: ${orderErr?.message}`);
    }

    const orderId = order.id;

    const itemsWithOrderId = lineItems.map((li) => ({
      ...li,
      order_id: orderId,
    }));
    const { error: itemsErr } = await db
      .from("order_items")
      .insert(itemsWithOrderId);

    if (itemsErr) {
      await db.from("orders").delete().eq("id", orderId);
      throw new Error(`Order items insertion failed: ${itemsErr.message}`);
    }

    const fulfillmentsWithOrderId = fulfillments.map((f) => ({
      ...f,
      order_id: orderId,
    }));
    await db.from("seller_order_fulfillments").insert(fulfillmentsWithOrderId);

    return orderId;
  }
}

export const orderRepository = new OrderRepository();
