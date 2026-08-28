// Floria — input validation helpers (server-only)
// Validate untrusted browser inputs before any business logic runs.

import "server-only";

import { Errors } from "./errors";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// India: 10-digit number, optionally +91 prefix
const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;

export function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

export function validateUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !isUuid(value)) {
    throw Errors.validation(`${field} must be a valid UUID.`);
  }
  return value;
}

export function validatePositiveInt(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw Errors.validation(`${field} must be a positive integer.`);
  }
  return n;
}

export function validateNonNegativeInt(value: unknown, field: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw Errors.validation(`${field} must be zero or a positive integer.`);
  }
  return n;
}

export interface AddressInput {
  full_name?: unknown;
  phone?: unknown;
  line1?: unknown;
  line2?: unknown;
  city?: unknown;
  state?: unknown;
  pincode?: unknown;
  instructions?: unknown;
}

export interface ValidatedAddress {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  instructions?: string;
}

export function validateAddress(input: AddressInput): ValidatedAddress {
  const errors: string[] = [];

  const full_name = String(input.full_name ?? "").trim();
  if (full_name.length < 2) errors.push("Name must be at least 2 characters.");

  const phone = String(input.phone ?? "")
    .trim()
    .replace(/\s/g, "");
  if (!PHONE_RE.test(phone))
    errors.push("Please enter a valid 10-digit Indian mobile number.");

  const line1 = String(input.line1 ?? "").trim();
  if (line1.length < 5)
    errors.push("Address line 1 must be at least 5 characters.");

  const city = String(input.city ?? "").trim();
  if (city.length < 2) errors.push("City is required.");

  const state = String(input.state ?? "").trim();
  if (state.length < 2) errors.push("State is required.");

  const pincode = String(input.pincode ?? "").trim();
  if (!PINCODE_RE.test(pincode))
    errors.push("PIN code must be exactly 6 digits.");

  if (errors.length > 0) throw Errors.validation(errors.join(" "));

  return {
    full_name,
    phone,
    line1,
    line2: input.line2 ? String(input.line2).trim() : undefined,
    city,
    state,
    pincode,
    instructions: input.instructions
      ? String(input.instructions).trim()
      : undefined,
  };
}

export type PaymentMethod = "online" | "cod";

export function validatePaymentMethod(value: unknown): PaymentMethod {
  if (value !== "online" && value !== "cod") {
    throw Errors.validation("Payment method must be 'online' or 'cod'.");
  }
  return value;
}

/** Validate seller product price in paise (must be > 0) */
export function validatePricePaise(value: unknown, field = "Price"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw Errors.validation(`${field} must be a positive integer in paise.`);
  }
  return n;
}

/** Validate seller product name */
export function validateProductName(value: unknown): string {
  const s = String(value ?? "").trim();
  if (s.length < 2 || s.length > 200)
    throw Errors.validation("Product name must be 2–200 characters.");
  return s;
}
