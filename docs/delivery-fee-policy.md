# Floria — Delivery Fee Engine & Policy Documentation

This document describes Floria's server-authoritative delivery fee engine, minimum order thresholds, master order delivery mode, delivery reasons, and historical snapshot policies.

---

## 1. Core Delivery Policy Architecture

- **Server-Authoritative Calculation**: All delivery fees are calculated by the backend [`DeliveryService`](file:///c:/Users/sudip/OneDrive/Desktop/webProjects/floria_by/backend/api/src/delivery/delivery.service.ts). Client submitted fees or shipping values are strictly ignored.
- **Single Master Order Delivery Fee**: Floria charges a single master delivery fee for an order, avoiding surprising customers with separate delivery charges per nursery partner on multi-nursery split orders.
- **Financial Segregation**: Customer delivery fees (`customer_delivery_fee`) are kept separate from seller revenue (`seller_gross` / `seller_net`) and internal logistics costs (`platform_delivery_cost`).

---

## 2. Configurable Rules & Defaults

Default settings stored in `public.platform_settings`:

| Key | Value | Description |
|---|---|---|
| `delivery_enabled` | `true` | Master toggle for platform delivery calculation |
| `base_delivery_fee_paise` | `4000` | Base delivery fee (4000 paise = ₹40.00) |
| `free_delivery_enabled` | `true` | Toggle for free delivery threshold rule |
| `free_delivery_threshold_paise` | `99900` | Free delivery minimum subtotal threshold (99900 paise = ₹999.00) |
| `master_order_delivery_mode` | `"master_order_single"` | Delivery fee mode: single master fee per order |

---

## 3. Delivery Calculation & Reason Codes

```
If delivery_enabled == false:
   -> Delivery Fee = ₹0.00
   -> Reason = DELIVERY_DISABLED

Else If free_delivery_enabled == true AND eligibleSubtotalPaise >= free_delivery_threshold_paise:
   -> Delivery Fee = ₹0.00
   -> Reason = FREE_DELIVERY_THRESHOLD

Else:
   -> Delivery Fee = base_delivery_fee_paise (e.g. ₹40.00)
   -> Reason = PAID_BELOW_THRESHOLD
```

### Reason Codes (`DeliveryFeeReason`)
- `FREE_DELIVERY_THRESHOLD`: Order eligible subtotal >= configured threshold (e.g. ₹999.00).
- `PAID_BELOW_THRESHOLD`: Order eligible subtotal < configured threshold (charged base fee ₹40.00).
- `FREE_DELIVERY_PROMOTION`: Server-applied promotional free delivery.
- `FREE_DELIVERY_ADMIN`: Admin manual delivery fee override.
- `DELIVERY_DISABLED`: Platform delivery calculations disabled.

---

## 4. Historical Order Snapshots

When an order is created, the checkout service records:
- `delivery_fee_paise`
- `delivery_fee_reason`
- `delivery_threshold_paise_snapshot`
- `eligible_delivery_subtotal_paise`

Future updates by Admin to `base_delivery_fee_paise` or `free_delivery_threshold_paise` in `platform_settings` **never** alter historical order fees.

---

## 5. Future Policy Dependencies & Expansion

- **Delivery Zones**: `ZONE SERVICEABILITY = FUTURE DEPENDENCY` (Architecture supports future zone surcharge table).
- **Courier Logistics Cost**: `PLATFORM LOGISTICS COST = FUTURE DEPENDENCY` (Separated from customer delivery fee).
