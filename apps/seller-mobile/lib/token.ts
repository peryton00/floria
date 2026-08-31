// Floria Seller Mobile — Secure Resilient Auth Token Store
const TOKEN_STORAGE_KEY = "@floria_seller_token_v1";
let memorySellerToken: string | null = null;

// Initialize from storage synchronously if available
if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
  try {
    const persisted = (globalThis as any).localStorage.getItem(TOKEN_STORAGE_KEY);
    if (persisted) {
      memorySellerToken = persisted;
    }
  } catch {
    // Ignore storage read errors on unsupported environments
  }
}

export function getSellerMobileToken(): string | null {
  return memorySellerToken;
}

export function setSellerMobileToken(token: string | null) {
  memorySellerToken = token;
  if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
    try {
      if (token) {
        (globalThis as any).localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        (globalThis as any).localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore write errors
    }
  }
}
