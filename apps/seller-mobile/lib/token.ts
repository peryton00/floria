// Floria Seller Mobile — Secure Resilient Auth Token Store
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "@floria_seller_token_v1";
let memorySellerToken: string | null = null;

export async function initSellerMobileToken(): Promise<string | null> {
  if (memorySellerToken) return memorySellerToken;
  try {
    const persisted = await AsyncStorage.getItem(TOKEN_KEY);
    if (persisted && persisted.trim()) {
      memorySellerToken = persisted.trim();
      return memorySellerToken;
    }
  } catch {
    // Ignore storage read error
  }
  return null;
}

export function getSellerMobileToken(): string | null {
  return memorySellerToken;
}

export async function setSellerMobileToken(token: string | null): Promise<void> {
  memorySellerToken = token;
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage write error
  }
}
