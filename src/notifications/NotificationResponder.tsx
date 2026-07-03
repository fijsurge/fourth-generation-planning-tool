import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useAuth } from "../auth/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import {
  registerGoalFollowupCategory,
  snoozeGoalFollowup,
  FollowupData,
  QuietHours,
  FOLLOWUP_ACTION_COMPLETE,
  FOLLOWUP_ACTION_RESCHEDULE,
  FOLLOWUP_ACTION_SNOOZE,
} from "./goalNotifications";
import {
  completeGoalFromNotification,
  enqueuePendingCompletion,
  flushPendingCompletions,
} from "./pendingGoalActions";
import { cancelDailyGoalReminder } from "./scheduler";
import { registerBackgroundNotificationTask } from "./backgroundNotificationTask";
import { goalEvents } from "../utils/goalEvents";

/**
 * Headless component (renders nothing) that owns the goal follow-up notification
 * lifecycle at the app root: registers the interactive category, routes taps and
 * action buttons, and flushes any queued offline completions on login.
 */
export function NotificationResponder() {
  const { getValidAccessToken, isLoggedIn } = useAuth();
  const {
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd,
  } = useSettings();

  // Refs so the once-registered listener never reads stale values.
  const tokenGetterRef = useRef(getValidAccessToken);
  tokenGetterRef.current = getValidAccessToken;
  const quietRef = useRef<QuietHours>({
    enabled: quietHoursEnabled,
    start: quietHoursStart,
    end: quietHoursEnd,
  });
  quietRef.current = { enabled: quietHoursEnabled, start: quietHoursStart, end: quietHoursEnd };

  const handleResponse = useCallback(
    async (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as unknown as FollowupData;
      if (!data || data.type !== "goal-followup") return;

      const action = response.actionIdentifier;

      if (action === FOLLOWUP_ACTION_COMPLETE) {
        try {
          const token = await tokenGetterRef.current();
          await completeGoalFromNotification(token, data.goalId, data.weekStartDate);
          // Refresh any mounted goal lists so the completion shows without a restart.
          goalEvents.emitGoalSaved();
        } catch {
          await enqueuePendingCompletion(data.goalId, data.weekStartDate);
        }
        return;
      }

      if (action === FOLLOWUP_ACTION_SNOOZE) {
        await snoozeGoalFollowup(data, quietRef.current);
        return;
      }

      // Reschedule button or a plain tap on the body — open the relevant screen.
      try {
        if (action === FOLLOWUP_ACTION_RESCHEDULE && data.calendarEventId) {
          router.push(`/event/${data.calendarEventId}`);
        } else {
          router.push(`/goal/${data.goalId}?weekStartDate=${data.weekStartDate}`);
        }
      } catch {
        // Router not ready (cold start race) — non-fatal.
      }
    },
    []
  );

  // Register category + background action task + clear the retired bulk reminder once.
  useEffect(() => {
    if (Platform.OS === "web") return;
    registerGoalFollowupCategory();
    registerBackgroundNotificationTask();
    cancelDailyGoalReminder();
  }, []);

  // Subscribe to taps/actions while the app is running.
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [handleResponse]);

  // Handle the response that cold-launched the app (body tap / reschedule).
  useEffect(() => {
    if (Platform.OS === "web") return;
    let active = true;
    Notifications.getLastNotificationResponseAsync().then((resp) => {
      if (active && resp) handleResponse(resp);
    });
    return () => { active = false; };
  }, [handleResponse]);

  // Flush queued offline completions once we have a session.
  useEffect(() => {
    if (Platform.OS === "web" || !isLoggedIn) return;
    (async () => {
      try {
        const token = await getValidAccessToken();
        await flushPendingCompletions(token);
        // Surface any just-flushed completions in mounted goal lists.
        goalEvents.emitGoalSaved();
      } catch {
        // Will retry on next login.
      }
    })();
  }, [isLoggedIn, getValidAccessToken]);

  return null;
}
