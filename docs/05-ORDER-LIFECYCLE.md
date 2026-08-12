# Order Lifecycle

PENDING_PAYMENT -> PAID / CONFIRMED -> SELLER_PENDING -> ACCEPTED -> PREPARING -> READY_FOR_PICKUP -> PICKED_UP -> PACKING -> OUT_FOR_DELIVERY -> DELIVERED

Refund path: REFUND_PENDING -> REFUNDED
Cancellation can occur according to policy.

Clients may request transitions but cannot arbitrarily set order state. Backend validates current state, actor role, ownership, allowed transition and required conditions. Important transitions create audit events.

Owners:
- payment/confirmation: system
- seller_pending/accepted/preparing/ready: seller
- pickup/packing: Floria operations
- out_for_delivery: delivery/operations
- delivered: system/delivery
- cancellation/refund: system/admin according to policy

Test payment failure, duplicate webhook, seller rejection, insufficient stock, cancellation, refund, delivery exception and damaged/wrong/missing item paths.
