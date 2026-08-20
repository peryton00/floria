"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellerRepository = exports.SellerRepository = void 0;
// Floria API — Seller Profile & Dashboard Repository
const database_js_1 = require("../../config/database.js");
const PRODUCT_LISTING_SELECT = `*, category:categories(id,name,slug), seller:seller_profiles(id,business_name), inventory:inventory(id,price_paise,stock_quantity,low_stock_threshold,sku,updated_at), images:product_images(*)`;
class SellerRepository {
    async findByUserId(userId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async findById(sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_profiles")
            .select("*")
            .eq("id", sellerId)
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async updateProfile(sellerId, updates) {
        const db = (0, database_js_1.getAdminDb)();
        // Auto-sync address string if structured components are updated
        let address = updates.address;
        if (!address && (updates.address_line1 || updates.city || updates.state || updates.pincode)) {
            address = [
                updates.address_line1,
                updates.address_line2,
                updates.locality,
                updates.landmark,
                updates.city,
                updates.district,
                updates.state,
                updates.pincode,
                updates.country || "India",
            ]
                .filter((part) => typeof part === "string" && part.trim().length > 0)
                .join(", ");
        }
        const payload = {
            ...updates,
            updated_at: new Date().toISOString(),
        };
        if (address) {
            payload.address = address;
        }
        if (updates.is_profile_completed && !updates.profile_completed_at) {
            payload.profile_completed_at = new Date().toISOString();
        }
        const { data, error } = await db
            .from("seller_profiles")
            .update(payload)
            .eq("id", sellerId)
            .select()
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async submitApplication(userId, appData) {
        const db = (0, database_js_1.getAdminDb)();
        const existing = await this.findByUserId(userId);
        const payload = {
            user_id: userId,
            business_name: appData.business_name || "New Nursery",
            business_description: appData.business_description || "",
            contact_phone: appData.contact_phone || "",
            contact_email: appData.contact_email || "",
            address: appData.address || "",
            status: existing ? existing.status : "pending",
            updated_at: new Date().toISOString(),
        };
        if (existing) {
            const { data, error } = await db
                .from("seller_profiles")
                .update(payload)
                .eq("id", existing.id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        else {
            const { data, error } = await db
                .from("seller_profiles")
                .insert({ ...payload, created_at: new Date().toISOString() })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
    }
    async findAll(status) {
        const db = (0, database_js_1.getAdminDb)();
        // 1. Ensure any user with role = 'seller' in user_profiles has a seller_profiles row
        try {
            const { data: sellerUsers } = await db
                .from("user_profiles")
                .select("id, full_name, email")
                .eq("role", "seller");
            if (sellerUsers && sellerUsers.length > 0) {
                for (const u of sellerUsers) {
                    const { data: existing } = await db
                        .from("seller_profiles")
                        .select("id")
                        .eq("user_id", u.id)
                        .maybeSingle();
                    if (!existing) {
                        await this.submitApplication(u.id, {
                            business_name: u.full_name || "Nursery Partner",
                            contact_email: u.email || "",
                            contact_phone: "",
                            address: "",
                            business_description: "Registered seller account.",
                        });
                    }
                }
            }
        }
        catch (e) {
            console.error("[SellerRepository] auto-sync seller profiles error:", e);
        }
        // 2. Query all seller profiles
        let query = db.from("seller_profiles").select("*");
        if (status) {
            query = query.eq("status", status);
        }
        const { data, error } = await query;
        if (error || !data)
            return [];
        return data;
    }
    async updateStatus(sellerId, status) {
        const db = (0, database_js_1.getAdminDb)();
        const { error } = await db
            .from("seller_profiles")
            .update({
            status,
            is_active: status === "approved",
            updated_at: new Date().toISOString(),
        })
            .eq("id", sellerId);
        return !error;
    }
    // ── Products ─────────────────────────────────────────────────────────────
    async findSellerProducts(sellerId, filters) {
        const db = (0, database_js_1.getAdminDb)();
        const profQuery = db.from("seller_profiles").select("id, user_id");
        const { data: sellerProf } = await (typeof profQuery.or === "function"
            ? profQuery.or(`id.eq.${sellerId},user_id.eq.${sellerId}`).maybeSingle()
            : profQuery.eq("id", sellerId).maybeSingle());
        const targetSellerId = sellerProf?.id || sellerId;
        const targetUserId = sellerProf?.user_id || sellerId;
        let q = db.from("products").select(PRODUCT_LISTING_SELECT);
        if (typeof q.or === "function") {
            q = q.or(`seller_id.eq.${targetSellerId},seller_id.eq.${targetUserId}`);
        }
        else {
            q = q.eq("seller_id", targetSellerId);
        }
        if (filters?.status && filters.status !== "all") {
            q = q.eq("status", filters.status);
        }
        if (filters?.search) {
            q = q.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
        const { data } = await (typeof q.order === "function" ? q.order("created_at", { ascending: false }) : q);
        let results = data || [];
        results = results.filter((p) => p.status !== "deleted");
        if (filters?.stock === "low") {
            results = results.filter((p) => {
                const qty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
                const thresh = p.inventory?.[0]?.low_stock_threshold ?? p.inventory?.low_stock_threshold ?? 5;
                return qty > 0 && qty <= thresh;
            });
        }
        else if (filters?.stock === "out") {
            results = results.filter((p) => {
                const qty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
                return qty <= 0;
            });
        }
        return results;
    }
    async findSellerProductById(sellerId, productId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("products")
            .select(PRODUCT_LISTING_SELECT)
            .eq("id", productId)
            .eq("seller_id", sellerId)
            .neq("status", "deleted")
            .maybeSingle();
        if (error || !data)
            return null;
        return data;
    }
    async createProduct(sellerId, productData) {
        const db = (0, database_js_1.getAdminDb)();
        const now = new Date().toISOString();
        const slug = (productData.name || "plant")
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-") + `-${Date.now().toString().slice(-4)}`;
        const { data: prod, error: prodErr } = await db
            .from("products")
            .insert({
            seller_id: sellerId,
            category_id: productData.category_id,
            name: productData.name.trim(),
            slug,
            description: productData.description?.trim() || null,
            care_instructions: productData.care_instructions?.trim() || null,
            status: productData.status || "active",
            created_at: now,
            updated_at: now,
        })
            .select()
            .single();
        if (prodErr || !prod)
            throw prodErr || new Error("Failed to create product");
        // Inventory
        await db.from("inventory").insert({
            product_id: prod.id,
            seller_id: sellerId,
            price_paise: Math.max(0, productData.price_paise || 0),
            stock_quantity: Math.max(0, productData.stock_quantity || 0),
            low_stock_threshold: Math.max(0, productData.low_stock_threshold ?? 5),
            sku: productData.sku?.trim() || null,
            updated_at: now,
        });
        // Primary & Additional Images Support
        if (Array.isArray(productData.images) && productData.images.length > 0) {
            for (let i = 0; i < productData.images.length; i++) {
                const imgObj = productData.images[i];
                const assetId = typeof imgObj === "string" ? imgObj : (imgObj.asset_id || imgObj.assetId || null);
                const imgUrl = typeof imgObj === "string" ? imgObj : (imgObj.url || productData.image_url || "/floria-logo.png");
                const isPrimary = typeof imgObj === "object" && imgObj.is_primary !== undefined ? imgObj.is_primary : i === 0;
                await db.from("product_images").insert({
                    product_id: prod.id,
                    asset_id: assetId,
                    url: imgUrl,
                    alt_text: prod.name,
                    display_order: i + 1,
                    is_primary: isPrimary,
                    created_at: now,
                });
            }
        }
        else if (productData.asset_id || productData.image_url) {
            await db.from("product_images").insert({
                product_id: prod.id,
                asset_id: productData.asset_id || null,
                url: productData.image_url || "/floria-logo.png",
                alt_text: prod.name,
                display_order: 1,
                is_primary: true,
                created_at: now,
            });
        }
        return this.findSellerProductById(sellerId, prod.id);
    }
    async updateProduct(sellerId, productId, updates) {
        const db = (0, database_js_1.getAdminDb)();
        const existing = await this.findSellerProductById(sellerId, productId);
        if (!existing)
            return null;
        const now = new Date().toISOString();
        const prodPayload = { updated_at: now };
        if (updates.name)
            prodPayload["name"] = updates.name.trim();
        if (updates.category_id)
            prodPayload["category_id"] = updates.category_id;
        if (updates.description !== undefined)
            prodPayload["description"] = updates.description?.trim() || null;
        if (updates.care_instructions !== undefined)
            prodPayload["care_instructions"] = updates.care_instructions?.trim() || null;
        if (updates.status)
            prodPayload["status"] = updates.status;
        await db.from("products").update(prodPayload).eq("id", productId).eq("seller_id", sellerId);
        // Update Inventory
        if (updates.price_paise !== undefined ||
            updates.stock_quantity !== undefined ||
            updates.low_stock_threshold !== undefined ||
            updates.sku !== undefined) {
            const invPayload = { updated_at: now };
            if (updates.price_paise !== undefined)
                invPayload["price_paise"] = Math.max(0, updates.price_paise);
            if (updates.stock_quantity !== undefined)
                invPayload["stock_quantity"] = Math.max(0, updates.stock_quantity);
            if (updates.low_stock_threshold !== undefined)
                invPayload["low_stock_threshold"] = Math.max(0, updates.low_stock_threshold);
            if (updates.sku !== undefined)
                invPayload["sku"] = updates.sku?.trim() || null;
            await db.from("inventory").update(invPayload).eq("product_id", productId).eq("seller_id", sellerId);
        }
        // Update Primary image if image_url or asset_id provided
        if (updates.asset_id || updates.image_url) {
            const { data: primaryImg } = await db
                .from("product_images")
                .select("id")
                .eq("product_id", productId)
                .eq("is_primary", true)
                .maybeSingle();
            if (primaryImg) {
                const imgPayload = {};
                if (updates.asset_id)
                    imgPayload["asset_id"] = updates.asset_id;
                if (updates.image_url)
                    imgPayload["url"] = updates.image_url;
                await db.from("product_images").update(imgPayload).eq("id", primaryImg.id);
            }
            else {
                await db.from("product_images").insert({
                    product_id: productId,
                    asset_id: updates.asset_id || null,
                    url: updates.image_url || "/floria-logo.png",
                    alt_text: existing.name,
                    display_order: 1,
                    is_primary: true,
                    created_at: now,
                });
            }
        }
        return this.findSellerProductById(sellerId, productId);
    }
    async updateProductStatus(sellerId, productId, status) {
        return this.updateProduct(sellerId, productId, { status });
    }
    async deleteProduct(sellerId, productId) {
        const db = (0, database_js_1.getAdminDb)();
        const { error } = await db
            .from("products")
            .update({ status: "deleted", updated_at: new Date().toISOString() })
            .eq("id", productId)
            .eq("seller_id", sellerId);
        return !error;
    }
    // ── Inventory ─────────────────────────────────────────────────────────────
    async findSellerInventory(sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("inventory")
            .select("*, product:products(*)")
            .eq("seller_id", sellerId);
        if (error || !data)
            return [];
        return data;
    }
    // ── Orders & Fulfillment ──────────────────────────────────────────────────
    async findSellerOrders(sellerId, filters) {
        const db = (0, database_js_1.getAdminDb)();
        // Retrieve seller profile to get both seller profile ID and user_id
        const profQuery = db.from("seller_profiles").select("id, user_id, business_name");
        const { data: sellerProf } = await (typeof profQuery.or === "function"
            ? profQuery.or(`id.eq.${sellerId},user_id.eq.${sellerId}`).maybeSingle()
            : profQuery.eq("id", sellerId).maybeSingle());
        const targetSellerId = sellerProf?.id || sellerId;
        const targetUserId = sellerProf?.user_id || sellerId;
        const sellerName = sellerProf?.business_name || "Nursery";
        // 1. Fetch order_items where seller_id_snapshot matches seller profile ID OR user ID
        const itemsQuery = db
            .from("order_items")
            .select("*, order:orders(*), product:products(name,slug,seller_id)");
        const { data: items } = await (typeof itemsQuery.or === "function"
            ? itemsQuery.or(`seller_id_snapshot.eq.${targetSellerId},seller_id_snapshot.eq.${targetUserId}`)
            : itemsQuery.eq("seller_id_snapshot", sellerId));
        // 2. Fetch orders where order.seller_id matches targetSellerId or targetUserId
        const ordersQuery = db
            .from("orders")
            .select("*, order_items(*, product:products(name,slug,seller_id))");
        const { data: masterOrders } = await (typeof ordersQuery.or === "function"
            ? ordersQuery.or(`seller_id.eq.${targetSellerId},seller_id.eq.${targetUserId}`)
            : ordersQuery.eq("seller_id", sellerId));
        const orderMap = new Map();
        // Process master orders first
        (masterOrders || []).forEach((order) => {
            const lineItems = (order.order_items || []).map((item) => {
                const pricePaise = item.unit_price_paise_snapshot || 0;
                const basePrice = item.base_price_paise_snapshot ?? item.unit_price_paise_snapshot ?? 0;
                const commRate = item.commission_rate_snapshot ?? (order.commission_rate ?? 0);
                const commPaise = item.commission_paise_snapshot ?? Math.round(basePrice * commRate);
                const sellerNetPaise = basePrice - commPaise;
                return {
                    product: {
                        id: item.product_id,
                        name: item.product_name_snapshot || item.product?.name || "Plant",
                        slug: item.product?.slug || "plant",
                    },
                    quantity: item.quantity,
                    pricePaise,
                    base_price_paise: basePrice,
                    seller_net_paise: sellerNetPaise,
                    commission_paise: commPaise,
                };
            });
            const subtotalPaise = lineItems.reduce((sum, it) => sum + it.pricePaise * it.quantity, 0) || order.subtotal_paise || 0;
            const sellerPayoutPaise = lineItems.reduce((sum, it) => sum + it.seller_net_paise * it.quantity, 0);
            orderMap.set(order.id, {
                masterOrderId: order.id,
                sellerId: targetSellerId,
                sellerName,
                customer: {
                    name: order.delivery_address_snapshot?.full_name || "Customer",
                    phone: order.delivery_address_snapshot?.phone || "",
                    address: order.delivery_address_snapshot || {},
                },
                items: lineItems,
                subtotalPaise,
                seller_payout_paise: sellerPayoutPaise,
                discountPaise: 0,
                totalPaise: subtotalPaise,
                status: order.status === "preparing" ? "Preparing" : "Order Placed",
                masterStatus: order.status,
                paymentMethod: order.notes?.includes("COD") ? "Cash on Delivery" : "Online Payment",
                createdAt: new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                }),
                createdAtTimestamp: new Date(order.created_at || Date.now()).getTime(),
            });
        });
        // Process order items to catch any items assigned to this seller across split orders
        (items || []).forEach((item) => {
            const order = item.order;
            if (!order)
                return;
            if (!orderMap.has(order.id)) {
                orderMap.set(order.id, {
                    masterOrderId: order.id,
                    sellerId: targetSellerId,
                    sellerName: item.seller?.business_name || sellerName,
                    customer: {
                        name: order.delivery_address_snapshot?.full_name || "Customer",
                        phone: order.delivery_address_snapshot?.phone || "",
                        address: order.delivery_address_snapshot || {},
                    },
                    items: [],
                    subtotalPaise: 0,
                    discountPaise: 0,
                    totalPaise: 0,
                    status: order.status === "preparing" ? "Preparing" : "Order Placed",
                    masterStatus: order.status,
                    paymentMethod: order.notes?.includes("COD") ? "Cash on Delivery" : "Online Payment",
                    createdAt: new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    }),
                    createdAtTimestamp: new Date(order.created_at || Date.now()).getTime(),
                });
            }
            const entry = orderMap.get(order.id);
            const exists = entry.items.some((it) => it.product.id === item.product_id);
            if (!exists) {
                const pricePaise = item.unit_price_paise_snapshot || 0;
                const basePrice = item.base_price_paise_snapshot ?? item.unit_price_paise_snapshot ?? 0;
                const commRate = item.commission_rate_snapshot ?? (order.commission_rate ?? 0);
                const commPaise = item.commission_paise_snapshot ?? Math.round(basePrice * commRate);
                const sellerNetPaise = basePrice - commPaise;
                entry.items.push({
                    product: {
                        id: item.product_id,
                        name: item.product_name_snapshot || item.product?.name || "Plant",
                        slug: item.product?.slug || "plant",
                    },
                    quantity: item.quantity,
                    pricePaise,
                    base_price_paise: basePrice,
                    seller_net_paise: sellerNetPaise,
                    commission_paise: commPaise,
                });
                entry.subtotalPaise += pricePaise * item.quantity;
                entry.totalPaise = entry.subtotalPaise;
                entry.seller_payout_paise = (entry.seller_payout_paise || 0) + (sellerNetPaise * item.quantity);
            }
        });
        // Apply status overrides from seller_order_fulfillments table
        const fulQuery = db.from("seller_order_fulfillments").select("*");
        const { data: fulfillments } = await (typeof fulQuery.or === "function"
            ? fulQuery.or(`seller_id.eq.${targetSellerId},seller_id.eq.${targetUserId}`)
            : fulQuery.eq("seller_id", sellerId));
        if (fulfillments) {
            const fulMap = new Map();
            fulfillments.forEach((f) => fulMap.set(f.order_id, f.status));
            orderMap.forEach((view, orderId) => {
                if (fulMap.has(orderId)) {
                    view.status = fulMap.get(orderId);
                }
            });
        }
        // ponytail: fallback intentionally removed — sellers with no orders see an empty list (correct tenant isolation)
        let results = Array.from(orderMap.values());
        if (filters?.status && filters.status !== "all") {
            results = results.filter((o) => o.status.toLowerCase() === filters.status.toLowerCase());
        }
        if (filters?.search) {
            const q = filters.search.toLowerCase();
            results = results.filter((o) => o.masterOrderId.toLowerCase().includes(q) ||
                o.customer.name.toLowerCase().includes(q));
        }
        // Sort by newest first
        results.sort((a, b) => b.createdAtTimestamp - a.createdAtTimestamp);
        return results;
    }
    async findSellerOrderById(sellerId, orderId) {
        // 1. Check in memory list first
        const orders = await this.findSellerOrders(sellerId);
        const inList = orders.find((o) => o.masterOrderId.toLowerCase() === orderId.toLowerCase());
        if (inList)
            return inList;
        // 2. If not found in list, query master order directly by orderId
        const db = (0, database_js_1.getAdminDb)();
        const { data: order } = await db
            .from("orders")
            .select("*, order_items(*, product:products(name,slug,seller_id)), seller_order_fulfillments(*)")
            .eq("id", orderId)
            .maybeSingle();
        if (!order)
            return null;
        const profQuery = db.from("seller_profiles").select("id, user_id, business_name");
        const { data: sellerProf } = await (typeof profQuery.or === "function"
            ? profQuery.or(`id.eq.${sellerId},user_id.eq.${sellerId}`).maybeSingle()
            : profQuery.eq("id", sellerId).maybeSingle());
        const targetSellerId = sellerProf?.id || sellerId;
        const targetUserId = sellerProf?.user_id || sellerId;
        const sellerName = sellerProf?.business_name || "Nursery";
        const items = order.order_items || [];
        const fuls = order.seller_order_fulfillments || [];
        const fulMatch = fuls.find((f) => f.seller_id === targetSellerId || f.seller_id === targetUserId);
        const lineItems = items.map((it) => {
            const pricePaise = it.unit_price_paise_snapshot || 0;
            const basePrice = it.base_price_paise_snapshot ?? it.unit_price_paise_snapshot ?? 0;
            const commRate = it.commission_rate_snapshot ?? (order.commission_rate ?? 0);
            const commPaise = it.commission_paise_snapshot ?? Math.round(basePrice * commRate);
            const sellerNetPaise = basePrice - commPaise;
            return {
                product: {
                    id: it.product_id,
                    name: it.product_name_snapshot || it.product?.name || "Plant",
                    slug: it.product?.slug || "plant",
                },
                quantity: it.quantity,
                pricePaise,
                base_price_paise: basePrice,
                seller_net_paise: sellerNetPaise,
                commission_paise: commPaise,
            };
        });
        const subtotalPaise = lineItems.reduce((sum, it) => sum + it.pricePaise * it.quantity, 0) || order.subtotal_paise || 0;
        const sellerPayoutPaise = lineItems.reduce((sum, it) => sum + it.seller_net_paise * it.quantity, 0);
        return {
            masterOrderId: order.id,
            sellerId: targetSellerId,
            sellerName,
            seller_payout_paise: sellerPayoutPaise,
            customer: {
                name: order.delivery_address_snapshot?.full_name || "Customer",
                phone: order.delivery_address_snapshot?.phone || "",
                address: typeof order.delivery_address_snapshot === "string"
                    ? order.delivery_address_snapshot
                    : [order.delivery_address_snapshot?.line1, order.delivery_address_snapshot?.line2, order.delivery_address_snapshot?.city, order.delivery_address_snapshot?.state, order.delivery_address_snapshot?.pincode].filter(Boolean).join(", ") || "Raipur, Chhattisgarh",
                addressSnapshot: order.delivery_address_snapshot || {},
            },
            items: lineItems,
            subtotalPaise,
            discountPaise: 0,
            totalPaise: subtotalPaise,
            status: fulMatch?.status || (order.status === "preparing" ? "Preparing" : "Order Placed"),
            masterStatus: order.status,
            paymentMethod: order.notes?.includes("COD") ? "Cash on Delivery" : "Online Payment",
            createdAt: new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            }),
            createdAtTimestamp: new Date(order.created_at || Date.now()).getTime(),
        };
    }
    async updateFulfillmentStatus(sellerId, masterOrderId, newStatus) {
        const db = (0, database_js_1.getAdminDb)();
        const orderView = await this.findSellerOrderById(sellerId, masterOrderId);
        if (!orderView)
            throw new Error("Order not found or access denied");
        // Allowed transition logic
        const currentStatus = orderView.status;
        const allowedTransitions = {
            "Order Placed": "Nursery Confirmed",
            "Nursery Confirmed": "Preparing",
            "Preparing": "Ready for Pickup",
            "Ready for Pickup": "Picked Up",
        };
        if (allowedTransitions[currentStatus] !== newStatus) {
            throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'`);
        }
        const payload = {
            order_id: masterOrderId,
            seller_id: sellerId,
            status: newStatus,
            updated_at: new Date().toISOString(),
        };
        if (newStatus === "Nursery Confirmed")
            payload["confirmed_at"] = new Date().toISOString();
        if (newStatus === "Preparing")
            payload["preparing_at"] = new Date().toISOString();
        if (newStatus === "Ready for Pickup")
            payload["ready_at"] = new Date().toISOString();
        if (newStatus === "Picked Up")
            payload["picked_up_at"] = new Date().toISOString();
        const { error } = await db.from("seller_order_fulfillments").upsert(payload, {
            onConflict: "order_id,seller_id",
        });
        if (error)
            throw error;
        const masterStatusMap = {
            "Nursery Confirmed": "nursery_confirmed",
            "Preparing": "preparing",
            "Ready for Pickup": "ready_for_pickup",
            "Picked Up": "picked_up",
            "Delivered": "delivered",
        };
        const masterStatus = masterStatusMap[newStatus] || newStatus.toLowerCase().replace(/ /g, "_");
        await db
            .from("orders")
            .update({ status: masterStatus, updated_at: new Date().toISOString() })
            .eq("id", masterOrderId);
        orderView.status = newStatus;
        return orderView;
    }
    // ── Dashboard Metrics ─────────────────────────────────────────────────────
    async getDashboard(sellerId) {
        const [profile, prods, orders] = await Promise.all([
            this.findById(sellerId),
            this.findSellerProducts(sellerId),
            this.findSellerOrders(sellerId),
        ]);
        let publishedProducts = 0;
        let draftProducts = 0;
        let lowStockProducts = 0;
        let outOfStockProducts = 0;
        const inventoryAlerts = [];
        prods.forEach((p) => {
            if (p.status === "active")
                publishedProducts++;
            else if (p.status === "draft")
                draftProducts++;
            const qty = p.inventory?.[0]?.stock_quantity ?? p.inventory?.stock_quantity ?? 0;
            const thresh = p.inventory?.[0]?.low_stock_threshold ?? p.inventory?.low_stock_threshold ?? 5;
            const pricePaise = p.inventory?.[0]?.price_paise ?? p.inventory?.price_paise ?? 0;
            if (qty <= 0) {
                outOfStockProducts++;
                inventoryAlerts.push({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    stockQuantity: qty,
                    lowStockThreshold: thresh,
                    pricePaise,
                    status: "out_of_stock",
                });
            }
            else if (qty <= thresh) {
                lowStockProducts++;
                inventoryAlerts.push({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    stockQuantity: qty,
                    lowStockThreshold: thresh,
                    pricePaise,
                    status: "low_stock",
                });
            }
        });
        let newOrders = 0;
        let preparingOrders = 0;
        let readyForPickupOrders = 0;
        let completedOrders = 0;
        let totalRevenuePaise = 0;
        orders.forEach((o) => {
            const s = o.status;
            if (s === "Order Placed" || s === "order_placed" || s === "seller_pending" || s === "Order Placed")
                newOrders++;
            else if (s === "Nursery Confirmed" || s === "Preparing" || s === "preparing")
                preparingOrders++;
            else if (s === "Ready for Pickup" || s === "ready_for_pickup")
                readyForPickupOrders++;
            else if (s === "Picked Up" || s === "Delivered" || s === "delivered")
                completedOrders++;
            if (s === "Picked Up" || s === "Delivered" || s === "delivered") {
                totalRevenuePaise += o.totalPaise || 0;
            }
        });
        const actionRequired = [];
        if (newOrders > 0) {
            actionRequired.push({
                id: "action-new-orders",
                title: `${newOrders} new order(s) awaiting nursery confirmation`,
                count: newOrders,
                type: "NEW_ORDERS",
                href: "/seller/orders?status=Order+Placed",
            });
        }
        if (outOfStockProducts > 0) {
            actionRequired.push({
                id: "action-out-of-stock",
                title: `${outOfStockProducts} product(s) out of stock`,
                count: outOfStockProducts,
                type: "OUT_OF_STOCK",
                href: "/seller/products?stock=out_of_stock",
            });
        }
        if (profile?.status === "pending") {
            actionRequired.push({
                id: "action-pending-app",
                title: "Your seller application is under review by Floria Admin",
                count: 1,
                type: "APPLICATION_PENDING",
                href: "/seller/profile",
            });
        }
        else if (profile?.status === "suspended") {
            actionRequired.push({
                id: "action-suspended-app",
                title: "Your seller account is suspended. Product creation and order fulfillment are restricted.",
                count: 1,
                type: "APPLICATION_SUSPENDED",
                href: "/seller/profile",
            });
        }
        return {
            profile,
            kpis: {
                totalProducts: prods.length,
                publishedProducts,
                draftProducts,
                lowStockProducts,
                outOfStockProducts,
                newOrders,
                preparingOrders,
                readyForPickupOrders,
                completedOrders,
                totalOrders: orders.length,
                totalRevenuePaise,
            },
            recentOrders: orders.slice(0, 5),
            inventoryAlerts,
            actionRequired,
        };
    }
    async getEarnings(sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: items, error } = await db
            .from("order_items")
            .select("*, order:orders(*)")
            .eq("seller_id_snapshot", sellerId);
        if (error || !items)
            return {
                totalGrossRevenuePaise: 0,
                totalCommissionPaise: 0,
                totalNetEarningsPaise: 0,
                ordersCount: 0,
                payouts: []
            };
        let totalGross = 0;
        let totalCommission = 0;
        const uniqueOrders = new Set();
        items.forEach((item) => {
            const order = item.order;
            if (!order)
                return;
            uniqueOrders.add(order.id);
            const gross = (item.unit_price_paise_snapshot || 0) * item.quantity;
            // commission_rate is an immutable snapshot stored at order creation time.
            // Never fall back to a hardcoded rate — use the snapshotted value from the order row.
            const rate = order.commission_rate ?? 0;
            const commission = Math.round(gross * rate);
            totalGross += gross;
            totalCommission += commission;
        });
        const net = totalGross - totalCommission;
        return {
            totalGrossRevenuePaise: totalGross,
            totalCommissionPaise: totalCommission,
            totalNetEarningsPaise: net,
            ordersCount: uniqueOrders.size,
            payouts: []
        };
    }
    async getPayouts(sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: payoutsList } = await db
            .from("payouts")
            .select("*")
            .eq("seller_id", sellerId)
            .order("created_at", { ascending: false });
        const { ledgerService } = await import("../../payments/ledger.service.js");
        const balances = await ledgerService.getSellerBalance(sellerId);
        const ledgerEntries = await ledgerService.getSellerLedgerEntries(sellerId, 30);
        return {
            status: "active",
            balances,
            payouts: payoutsList || [],
            ledgerEntries,
        };
    }
    async getAnalytics(sellerId, range) {
        const db = (0, database_js_1.getAdminDb)();
        const { data: items, error } = await db
            .from("order_items")
            .select("*, order:orders(*), product:products(name, category_id, category:categories(name))")
            .eq("seller_id_snapshot", sellerId);
        if (error || !items) {
            return {
                summary: { grossRevenuePaise: 0, ordersCount: 0, unitsSold: 0 },
                series: [],
                topProducts: [],
                categories: []
            };
        }
        const now = Date.now();
        let filterMs = 30 * 24 * 60 * 60 * 1000;
        if (range === "7d")
            filterMs = 7 * 24 * 60 * 60 * 1000;
        else if (range === "90d")
            filterMs = 90 * 24 * 60 * 60 * 1000;
        else if (range === "12m")
            filterMs = 365 * 24 * 60 * 60 * 1000;
        else if (range === "today")
            filterMs = 24 * 60 * 60 * 1000;
        const filteredItems = items.filter((item) => {
            const order = item.order;
            if (!order)
                return false;
            const orderTime = new Date(order.created_at).getTime();
            return (now - orderTime) <= filterMs;
        });
        let totalGross = 0;
        let unitsSold = 0;
        const uniqueOrders = new Set();
        const productStats = new Map();
        const categoryStats = new Map();
        const seriesStats = new Map();
        filteredItems.forEach((item) => {
            const order = item.order;
            if (!order)
                return;
            uniqueOrders.add(order.id);
            const gross = (item.unit_price_paise_snapshot || 0) * item.quantity;
            totalGross += gross;
            unitsSold += item.quantity;
            const prodId = item.product_id;
            const prodName = item.product_name_snapshot || item.product?.name || "Plant Product";
            if (!productStats.has(prodId)) {
                productStats.set(prodId, { name: prodName, quantity: 0, revenuePaise: 0 });
            }
            const pStat = productStats.get(prodId);
            pStat.quantity += item.quantity;
            pStat.revenuePaise += gross;
            const catName = item.product?.category?.name || "Uncategorized";
            if (!categoryStats.has(catName)) {
                categoryStats.set(catName, { name: catName, quantity: 0, revenuePaise: 0 });
            }
            const cStat = categoryStats.get(catName);
            cStat.quantity += item.quantity;
            cStat.revenuePaise += gross;
            const dateStr = new Date(order.created_at).toISOString().split("T")[0];
            if (!seriesStats.has(dateStr)) {
                seriesStats.set(dateStr, { grossRevenuePaise: 0, ordersCount: 0, unitsSold: 0 });
            }
            const sStat = seriesStats.get(dateStr);
            sStat.grossRevenuePaise += gross;
            sStat.unitsSold += item.quantity;
        });
        const orderDatesMap = new Map();
        filteredItems.forEach((item) => {
            const order = item.order;
            if (!order)
                return;
            const dateStr = new Date(order.created_at).toISOString().split("T")[0];
            if (!orderDatesMap.has(dateStr)) {
                orderDatesMap.set(dateStr, new Set());
            }
            orderDatesMap.get(dateStr).add(order.id);
        });
        orderDatesMap.forEach((ordersSet, dateStr) => {
            if (seriesStats.has(dateStr)) {
                seriesStats.get(dateStr).ordersCount = ordersSet.size;
            }
        });
        const topProducts = Array.from(productStats.values())
            .sort((a, b) => b.revenuePaise - a.revenuePaise)
            .slice(0, 5);
        const categories = Array.from(categoryStats.values())
            .sort((a, b) => b.revenuePaise - a.revenuePaise);
        const series = Array.from(seriesStats.entries())
            .map(([date, val]) => ({ date, ...val }))
            .sort((a, b) => a.date.localeCompare(b.date));
        return {
            summary: {
                grossRevenuePaise: totalGross,
                ordersCount: uniqueOrders.size,
                unitsSold
            },
            series,
            topProducts,
            categories
        };
    }
    // ── Documents ────────────────────────────────────────────────────────────
    async findSellerDocuments(sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_documents")
            .select("*")
            .eq("seller_id", sellerId)
            .order("created_at", { ascending: false });
        if (error || !data)
            return [];
        return data;
    }
    async insertSellerDocument(doc) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_documents")
            .insert({
            ...doc,
            status: "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateSellerDocumentStatus(docId, status, reviewNotes) {
        const db = (0, database_js_1.getAdminDb)();
        const { data, error } = await db
            .from("seller_documents")
            .update({
            status,
            review_notes: reviewNotes || null,
            updated_at: new Date().toISOString(),
        })
            .eq("id", docId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // ── Settings ─────────────────────────────────────────────────────────────
    async findSellerSettings(sellerId) {
        const db = (0, database_js_1.getAdminDb)();
        const { data } = await db
            .from("seller_settings")
            .select("*")
            .eq("seller_id", sellerId)
            .maybeSingle();
        if (data)
            return data;
        // Default settings if not created yet
        return {
            seller_id: sellerId,
            new_order_notifications: true,
            low_stock_notifications: true,
            email_notifications: true,
        };
    }
    async updateSellerSettings(sellerId, updates) {
        const db = (0, database_js_1.getAdminDb)();
        const existing = await this.findSellerSettings(sellerId);
        const payload = {
            seller_id: sellerId,
            new_order_notifications: updates.new_order_notifications ?? existing.new_order_notifications ?? true,
            low_stock_notifications: updates.low_stock_notifications ?? existing.low_stock_notifications ?? true,
            email_notifications: updates.email_notifications ?? existing.email_notifications ?? true,
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await db
            .from("seller_settings")
            .upsert(payload, { onConflict: "seller_id" })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.SellerRepository = SellerRepository;
exports.sellerRepository = new SellerRepository();
