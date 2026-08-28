# Testing Strategy

## Unit

Price, commission, delivery fees, order transitions, permissions, inventory, validation.

## Integration

Seller product/stock, customer reads, checkout revalidation, order creation, webhook processing, seller isolation, admin operations and refund state.

## Concurrency

Two buyers attempt last unit; only one succeeds and stock never becomes negative.

## Payment

Success, duplicate webhook, invalid signature, wrong amount/currency/order, failure.

## Authorization

Seller A cannot see Seller B data. Customer cannot see another customer. Customer cannot access admin/seller. Seller cannot perform admin actions.

## E2E

Customer discovery -> product -> cart -> checkout -> payment/demo -> confirmation -> seller order -> accept -> prepare -> ready -> operations -> tracking.

## Visual

Test 320/375/390/430/768/1024/1440px. Check overflow, bottom nav, fixed elements, product grids, checkout, typography, imagery and states.
