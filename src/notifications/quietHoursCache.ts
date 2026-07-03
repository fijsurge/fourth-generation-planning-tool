import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { QuietHours } from "./goalNotifications";

/**
 * Local mirror of the user's quiet-hours setting. The real value lives in Google
 * Sheets, but the headless background notification task can't fetch it (no auth
 * context, and we don't want a network round-trip just to snooze), so we cache it
 * locally whenever settings load/change.
 */

const KEY = "quietHoursCache";
const DEFAULT: QuietHours = { enabled: true, start: "21:00", end: "07:00" };

export async function cacheQuietHours(q: QuietHours): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(q));
  } catch {
    // Best-effort
  }
}

export async function readCachedQuietHours(): Promise<QuietHours> {
  if (Platform.OS === "web") return DEFAULT;
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.enabled === "boolean") return parsed as QuietHours;
    }
  } catch {
    // fall through to default
  }
  return DEFAULT;
}
