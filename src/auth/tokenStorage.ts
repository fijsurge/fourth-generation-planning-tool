import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEYS = {
  googleAccessToken: "google_access_token",
  googleRefreshToken: "google_refresh_token",
  googleTokenExpiry: "google_token_expiry",
} as const;

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  } else {
    return SecureStore.getItemAsync(key);
  }
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp in ms
}

export async function saveGoogleTokens(tokens: StoredTokens): Promise<void> {
  await setItem(KEYS.googleAccessToken, tokens.accessToken);
  if (tokens.refreshToken) {
    await setItem(KEYS.googleRefreshToken, tokens.refreshToken);
  }
  if (tokens.expiresAt) {
    await setItem(KEYS.googleTokenExpiry, String(tokens.expiresAt));
  }
}

export async function getGoogleTokens(): Promise<StoredTokens | null> {
  const accessToken = await getItem(KEYS.googleAccessToken);
  if (!accessToken) return null;

  const refreshToken = (await getItem(KEYS.googleRefreshToken)) ?? undefined;
  const expiryStr = await getItem(KEYS.googleTokenExpiry);
  const expiresAt = expiryStr ? Number(expiryStr) : undefined;

  return { accessToken, refreshToken, expiresAt };
}

export async function clearGoogleTokens(): Promise<void> {
  await deleteItem(KEYS.googleAccessToken);
  await deleteItem(KEYS.googleRefreshToken);
  await deleteItem(KEYS.googleTokenExpiry);
}

export function isTokenExpired(tokens: StoredTokens): boolean {
  if (!tokens.expiresAt) return false;
  // Consider expired 60 seconds early to avoid edge cases
  return Date.now() > tokens.expiresAt - 60_000;
}
