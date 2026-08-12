# Product Requirements

Floria is a technology-enabled multi-vendor marketplace for plants and gardening products.

Nurseries own:
- catalogue
- pricing
- quality
- stock
- order acceptance/rejection
- preparation before pickup

Floria owns:
- marketplace technology
- customer storefront/acquisition
- payment/order coordination
- packing
- delivery coordination
- moderation
- support/operational exceptions

## MVP success
One complete transaction must work without manual database edits:
seller lists -> customer buys -> payment verified -> correct nursery receives order -> accepts -> prepares -> Floria picks up -> packs -> delivers -> customer sees final state.

## P0 Customer
Registration/login, home, categories, search/basic filters, listing, product detail with nursery/price/stock, cart, one-nursery checkout, address, payment/COD where enabled, confirmation, orders, tracking, basic support.

## P0 Seller
Login, onboarding/profile, product CRUD, images, price/stock, order notification, accept/reject, preparing, ready for pickup, order history.

## P0 Operations/Admin
RBAC, seller approval, listing moderation, order management, pickup, packing, delivery, payment/refund visibility, commission visibility, audit trail, basic operational dashboard.

## Deferred
Reviews, coupons, advanced filters/analytics, automated settlement until confirmed, advanced support, AI assistant, recommendations, subscriptions, loyalty, multi-nursery cart, advanced route optimization, seller ranking, plant-care marketplace, complex B2B.
