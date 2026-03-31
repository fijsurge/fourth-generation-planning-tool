import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { WeeklyGoal } from "../models/WeeklyGoal";

const NOTIF_DAILY_GOALS = "daily-goals-reminder";
const NOTIF_CLOSEOUT = "closeout-reminder";
const LEGACY_PREFIX = "q2-weekly-"; // kept to cancel old-format notifications on upgrade

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function cancelAllScheduled(): Promise<void> {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (
      notif.identifier === NOTIF_DAILY_GOALS ||
      notif.identifier === NOTIF_CLOSEOUT ||
      notif.identifier.startsWith(LEGACY_PREFIX)
    ) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

/**
 * Schedule a daily morning reminder showing Q1+Q2 incomplete goals.
 * Fires every day at the given HH:mm time.
 */
export async function scheduleDailyGoalReminder(
  goals: WeeklyGoal[],
  reminderTime: string
): Promise<void> {
  if (Platform.OS === "web") return;

  const importantGoals = goals.filter(
    (g) => (g.quadrant === 1 || g.quadrant === 2) && g.status !== "complete"
  );

  await Notifications.cancelScheduledNotificationAsync(NOTIF_DAILY_GOALS).catch(() => {});
  // Also cancel legacy notifications on upgrade
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith(LEGACY_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  if (importantGoals.length === 0) return;

  const [hourStr, minuteStr] = reminderTime.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return;

  const body = importantGoals
    .slice(0, 5)
    .map((g) => `• ${g.goalText}`)
    .join("\n");

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_DAILY_GOALS,
    content: {
      title: "Your goals today",
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      repeats: true,
    } as any,
  });
}

/**
 * Schedule a weekly closeout nudge on the given weekday at the given HH:mm time.
 * weekday: 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday, 7=Saturday
 */
export async function scheduleCloseoutReminder(
  weekday: number,
  reminderTime: string
): Promise<void> {
  if (Platform.OS === "web") return;

  await Notifications.cancelScheduledNotificationAsync(NOTIF_CLOSEOUT).catch(() => {});

  const [hourStr, minuteStr] = reminderTime.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_CLOSEOUT,
    content: {
      title: "Time to close out the week",
      body: "Reflect on what went well, move unfinished goals, and set intentions for next week.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
      repeats: true,
    } as any,
  });
}
