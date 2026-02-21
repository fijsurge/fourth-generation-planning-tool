import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { WeeklyGoal } from "../models/WeeklyGoal";

const NOTIF_ID_PREFIX = "q2-weekly-";

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
    if (notif.identifier.startsWith(NOTIF_ID_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

export async function scheduleWeeklyQ2Reminders(
  goals: WeeklyGoal[],
  reminderTime: string
): Promise<void> {
  if (Platform.OS === "web") return;

  const q2Goals = goals.filter(
    (g) => g.quadrant === 2 && g.status !== "complete"
  );

  await cancelAllScheduled();

  if (q2Goals.length === 0) return;

  const [hourStr, minuteStr] = reminderTime.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return;

  const body = q2Goals.map((g) => `• ${g.goalText}`).join("\n");

  await Notifications.scheduleNotificationAsync({
    identifier: `${NOTIF_ID_PREFIX}reminder`,
    content: {
      title: "Q2 Weekly Reminder",
      body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 2, // Monday
      hour,
      minute,
      repeats: true,
    } as any,
  });
}
