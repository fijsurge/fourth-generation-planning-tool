import { Platform } from "react-native";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { getGoogleTokens, saveGoogleTokens, isTokenExpired } from "../auth/tokenStorage";
import { refreshAccessToken } from "../auth/google";
import {
  FollowupData,
  snoozeGoalFollowup,
  FOLLOWUP_ACTION_COMPLETE,
  FOLLOWUP_ACTION_SNOOZE,
} from "./goalNotifications";
import { completeGoalFromNotification, enqueuePendingCompletion } from "./pendingGoalActions";
import { readCachedQuietHours } from "./quietHoursCache";

/**
 * Background handler for goal follow-up action buttons.
 *
 * On Android, `expo-notifications` runs a registered task in response to a
 * notification action press while the app is backgrounded or terminated — which
 * the in-app response listener cannot catch. This lets "Mark complete" and
 * "Snooze" work without opening the app. Runs headless (no React/Context), so it
 * refreshes the auth token directly from secure storage and reads quiet hours
 * from the local cache.
 *
 * Must be defined at module scope and imported early (see app/_layout.tsx).
 */

export const BACKGROUND_NOTIFICATION_TASK = "goal-followup-background";

async function getValidTokenHeadless(): Promise<string | null> {
  const stored = await getGoogleTokens();
  if (!stored) return null;
  if (!isTokenExpired(stored)) return stored.accessToken;
  if (!stored.refreshToken) return null;
  try {
    const result = await refreshAccessToken(stored.refreshToken);
    await saveGoogleTokens({
      accessToken: result.access_token,
      refreshToken: stored.refreshToken,
      expiresAt: Date.now() + result.expires_in * 1000,
    });
    return result.access_token;
  } catch {
    return null;
  }
}

if (Platform.OS !== "web") {
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }: any) => {
    if (error || !data) return;
    // Only notification responses carry an actionIdentifier; ignore received-notification events.
    if (!("actionIdentifier" in data)) return;

    const action: string = data.actionIdentifier;
    const notifData = data.notification?.request?.content?.data as FollowupData | undefined;
    if (!notifData || notifData.type !== "goal-followup") return;

    if (action === FOLLOWUP_ACTION_COMPLETE) {
      const token = await getValidTokenHeadless();
      if (token) {
        await completeGoalFromNotification(token, notifData.goalId, notifData.weekStartDate);
      } else {
        await enqueuePendingCompletion(notifData.goalId, notifData.weekStartDate);
      }
    } else if (action === FOLLOWUP_ACTION_SNOOZE) {
      const quiet = await readCachedQuietHours();
      await snoozeGoalFollowup(notifData, quiet);
    }
    // Reschedule / body taps open the app and are handled by the in-app listener.
  });
}

/** Register the background task. Android-only — iOS doesn't deliver background action presses. */
export async function registerBackgroundNotificationTask(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
  } catch {
    // Already registered / unavailable — non-fatal.
  }
}
