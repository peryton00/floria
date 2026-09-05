// Floria API — Cryptographic Session Token Utility
import crypto from "crypto";

export interface SessionPayload {
  sub: string;
  role: string;
  email?: string;
  seller_id?: string;
  delivery_partner_id?: string;
  public_partner_id?: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

/**
 * Creates an HMAC-SHA256 signed session token.
 * Format: `<base64url(payload)>.<base64url(signature)>`
 */
export function signSessionToken(payload: SessionPayload, secret: string): string {
  if (!secret) {
    throw new Error("[SessionToken] Secret key is required to sign session tokens.");
  }
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Cryptographically verifies an HMAC-SHA256 signed session token using constant-time comparison.
 * Returns decoded payload if valid and unexpired, otherwise returns null.
 */
export function verifySessionToken(token: string, secret: string): SessionPayload | null {
  if (!token || typeof token !== "string" || !secret) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null; // Unsigned or malformed token
  }

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (sigBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload: SessionPayload = JSON.parse(payloadJson);

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
