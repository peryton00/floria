// Floria Seller Mobile — In-Memory / Secure Auth Token Store
let memorySellerToken: string | null = null;

export function getSellerMobileToken(): string | null {
  return memorySellerToken;
}

export function setSellerMobileToken(token: string | null) {
  memorySellerToken = token;
}
