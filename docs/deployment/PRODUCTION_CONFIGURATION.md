# Floria — Production Configuration Reference (Sanitized)

---

## 1. Domain & Routing Topology

### Currently Hosted Production

| Application          | Current Deployed URL              | Hosting Provider   | SSL / TLS              |
| :------------------- | :-------------------------------- | :----------------- | :--------------------- |
| **Customer Web**     | `https://floriaa-web.vercel.app`  | Vercel Edge / CDN  | TLS 1.3 (Auto Vercel)  |
| **Backend REST API** | `https://floria-api.onrender.com` | Render Web Service | TLS 1.3 (Strict HTTPS) |

### Local Surfaces (Pending Independent Deployment)

| Application         | Workspace Package         | Development URL         | Future Production Domain   |
| :------------------ | :------------------------ | :---------------------- | :------------------------- |
| **Seller Web**      | `@floria/seller-web`      | `http://localhost:3001` | `https://seller.floria.in` |
| **Admin Web**       | `@floria/admin-web`       | `http://localhost:3002` | `https://admin.floria.in`  |
| **Customer Mobile** | `@floria/customer-mobile` | Expo Local Runtime      | App Store / Play Store     |
| **Seller Mobile**   | `@floria/seller-mobile`   | Expo Local Runtime      | App Store / Play Store     |
| **Admin Mobile**    | `@floria/admin-mobile`    | Expo Local Runtime      | Internal Distribution      |
| **Delivery Mobile** | `@floria/delivery-mobile` | Expo Local Runtime      | Play Store (Android POD)   |

---

## 2. Cashfree Production Configuration

- **Environment**: `PRODUCTION` (`https://api.cashfree.com/pg`) / `SANDBOX` (`https://sandbox.cashfree.com/pg`)
- **API Version**: `2023-08-01`
- **Return URL**: `https://floriaa-web.vercel.app/checkout?order_id={order_id}`
- **Webhook Endpoint**: `https://floria-api.onrender.com/api/v1/payments/webhooks/cashfree`
- **Signature Verification**: HMAC-SHA256 with timestamp replay protection.

---

## 3. Storage Bucket Configuration

| Bucket Name         | Access Policy                                 | Allowed MIME Types                           | Max Size |
| :------------------ | :-------------------------------------------- | :------------------------------------------- | :------- |
| `product-media`     | Public Read / Authenticated Seller Write      | `image/jpeg`, `image/png`, `image/webp`      | 10 MB    |
| `nursery-branding`  | Public Read / Authenticated Seller Write      | `image/jpeg`, `image/png`, `image/webp`      | 5 MB     |
| `private-documents` | Signed URL Read Only / Server Write           | `application/pdf`, `image/jpeg`, `image/png` | 25 MB    |
| `delivery-pod`      | Authenticated Operations Read / Courier Write | `image/jpeg`, `image/png`, `image/webp`      | 10 MB    |
