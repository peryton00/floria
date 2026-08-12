# Security Baseline

Use Supabase Auth and server-side authorization.

Seller isolation: seller sees/changes only own profile, products, inventory and orders.

Customer isolation: customer sees only own profile, addresses, cart, orders and related payment/order data.

Audit: seller approval/suspension, product moderation, refunds, order interventions, commission/settlement and important settings changes.

Never expose service-role keys, payment secrets, webhook secrets or deployment tokens.

Validate all input. Validate uploads by type/size/storage policy. Use migrations. Backups/recovery. Rate-limit sensitive operations. HTTPS everywhere.
