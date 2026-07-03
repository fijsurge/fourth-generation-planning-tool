import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

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

/**
 * Cancel the retired bulk morning reminder (and any legacy variants). The daily
 * Q1+Q2 list has been replaced by per-goal follow-ups; this clears any that were
 * scheduled by an earlier app version.
 */
export async function cancelDailyGoalReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(NOTIF_DAILY_GOALS).catch(() => {});
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith(LEGACY_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }
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
