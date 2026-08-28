# Business Rules

## Nursery

No nearby selection. The purchased listing identifies the nursery. MVP cart/order cannot mix nurseries.

## Inventory

Seller owns accuracy. Server revalidates stock and price at checkout. Inventory updates must be atomic/transaction-safe so two buyers cannot purchase the last unit.

## Order snapshots

Store immutable snapshots of product name, seller, unit price, quantity, commission rate/amount and line total.

## Payment

checkout -> provider -> verified webhook -> mark paid -> seller fulfillment task -> notify seller. Never trust browser payment-success state. Verify signature, amount, currency and internal order reference. Idempotent webhooks.

## Commission

Configurable until final commercial rate is confirmed. Historical orders store the actual applied rate/amount.

## Delivery

seller prepares -> ready for pickup -> Floria picks up -> packing -> out for delivery -> delivered.

## Refunds/cancellation

Support policy-driven handling for customer cancellation, seller rejection, wrong stock, failed payment, refund pending/completed and delivery/product issues. Do not invent final policy.
