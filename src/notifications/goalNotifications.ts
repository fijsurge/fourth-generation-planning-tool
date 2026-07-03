import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

/**
 * Per-goal "did you finish?" follow-up notifications (Rule A).
 *
 * These are deterministic, one-off date-triggered notifications scheduled when a
 * goal is linked to a calendar event. They fire the day AFTER the event ends, at
 * the configured follow-up hour, and never inside quiet hours. The notification's
 * text is baked in at schedule time (expo can't recompute content at fire time),
 * so the lifecycle is: schedule on link, reschedule on event edit, cancel when the
 * goal is completed / unlinked / deleted or the event is removed.
 *
 * expo-notifications itself is the registry — every follow-up uses the
 * deterministic identifier `goal-followup-<goalId>`, so cancel/reschedule are just
 * lookups by id.
 */

export const FOLLOWUP_PREFIX = "goal-followup-";
export const FOLLOWUP_CATEGORY = "goal-followup";
export const FOLLOWUP_CHANNEL = "goal-followups";

export const FOLLOWUP_ACTION_COMPLETE = "complete";
export const FOLLOWUP_ACTION_RESCHEDULE = "reschedule";
export const FOLLOWUP_ACTION_SNOOZE = "snooze";

export interface QuietHours {
  enabled: boolean;
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface FollowupData {
  type: "goal-followup";
  goalId: string;
  weekStartDate: string;
  goalText: string;
  calendarEventId?: string;
}

function followupId(goalId: string): string {
  return `${FOLLOWUP_PREFIX}${goalId}`;
}

function parseHm(hm: string, fallbackHour: number, fallbackMinute = 0): [number, number] {
  const [h, m] = (hm || "").split(":");
  const hour = parseInt(h, 10);
  const minute = parseInt(m, 10);
  return [isNaN(hour) ? fallbackHour : hour, isNaN(minute) ? fallbackMinute : minute];
}

/**
 * If `date` lands inside the quiet-hours window, push it to the moment quiet
 * hours end. Handles windows that wrap midnight (e.g. 21:00 → 07:00).
 */
export function clampOutOfQuietHours(date: Date, quiet: QuietHours): Date {
  if (!quiet.enabled) return date;
  const [sh, sm] = parseHm(quiet.start, 21);
  const [eh, em] = parseHm(quiet.end, 7);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (startMin === endMin) return date; // empty window — treat as no quiet hours

  const mins = date.getHours() * 60 + date.getMinutes();
  const wraps = startMin > endMin; // window spans midnight
  const inQuiet = wraps
    ? mins >= startMin || mins < endMin
    : mins >= startMin && mins < endMin;
  if (!inQuiet) return date;

  const out = new Date(date);
  // Evening side of a wrapping window → quiet hours end the next morning.
  if (wraps && mins >= startMin) {
    out.setDate(out.getDate() + 1);
  }
  out.setHours(eh, em, 0, 0);
  return out;
}

/**
 * One day after the event, mirroring the event's own time-of-day, nudged out of
 * quiet hours. A 3pm block → a check-in around 3pm the next day, so follow-ups
 * spread across the day by your real schedule instead of batching at a fixed hour.
 * All-day events have no meaningful time, so they fall back to 9am next day.
 * Returns null if the resulting moment is already in the past.
 */
export function computeFollowupDate(
  eventStartISO: string,
  allDay: boolean,
  quiet: QuietHours
): Date | null {
  const start = new Date(eventStartISO);
  if (isNaN(start.getTime())) return null;
  const d = new Date(start);
  d.setDate(d.getDate() + 1); // next-day buffer, same time-of-day
  if (allDay) d.setHours(9, 0, 0, 0);
  else d.setSeconds(0, 0);
  const clamped = clampOutOfQuietHours(d, quiet);
  if (clamped.getTime() <= Date.now()) return null;
  return clamped;
}

async function scheduleAt(date: Date, data: FollowupData): Promise<void> {
  await cancelGoalFollowup(data.goalId);
  await Notifications.scheduleNotificationAsync({
    identifier: followupId(data.goalId),
    content: {
      title: "Goal check-in",
      body: `Did you finish "${data.goalText}"?`,
      categoryIdentifier: FOLLOWUP_CATEGORY,
      data: data as unknown as Record<string, unknown>,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: FOLLOWUP_CHANNEL,
    } as any,
  });
}

export async function scheduleGoalFollowup(opts: {
  goalId: string;
  goalText: string;
  weekStartDate: string;
  calendarEventId?: string;
  eventStartISO: string;
  allDay: boolean;
  quiet: QuietHours;
}): Promise<void> {
  if (Platform.OS === "web") return;
  const date = computeFollowupDate(opts.eventStartISO, opts.allDay, opts.quiet);
  if (!date) {
    // Nothing valid to schedule — make sure no stale follow-up lingers.
    await cancelGoalFollowup(opts.goalId);
    return;
  }
  await scheduleAt(date, {
    type: "goal-followup",
    goalId: opts.goalId,
    weekStartDate: opts.weekStartDate,
    goalText: opts.goalText,
    calendarEventId: opts.calendarEventId,
  });
}

export async function cancelGoalFollowup(goalId: string): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(followupId(goalId)).catch(() => {});
}

/** Cancel every pending goal follow-up (e.g. when the feature is switched off). */
export async function cancelAllGoalFollowups(): Promise<void> {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith(FOLLOWUP_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {});
    }
  }
}

/** Read the data payload of a goal's pending follow-up, if one is scheduled. */
export async function getScheduledFollowupData(goalId: string): Promise<FollowupData | null> {
  if (Platform.OS === "web") return null;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const match = scheduled.find((n) => n.identifier === followupId(goalId));
  const data = match?.content?.data as FollowupData | undefined;
  return data?.type === "goal-followup" ? data : null;
}

/**
 * Reschedule a goal's follow-up when its calendar event moves. No-op if the goal
 * has no pending follow-up (e.g. follow-ups are off or it already fired) — we rely
 * on the stored data payload so we don't need to re-fetch the goal.
 */
export async function rescheduleFollowupForEvent(opts: {
  goalId: string;
  newEventStartISO: string;
  allDay: boolean;
  calendarEventId?: string;
  quiet: QuietHours;
}): Promise<void> {
  if (Platform.OS === "web") return;
  const data = await getScheduledFollowupData(opts.goalId);
  if (!data) return;
  await scheduleGoalFollowup({
    goalId: data.goalId,
    goalText: data.goalText,
    weekStartDate: data.weekStartDate,
    calendarEventId: opts.calendarEventId ?? data.calendarEventId,
    eventStartISO: opts.newEventStartISO,
    allDay: opts.allDay,
    quiet: opts.quiet,
  });
}

/** Re-fire a follow-up `hours` from now (clamped out of quiet hours). */
export async function snoozeGoalFollowup(
  data: FollowupData,
  quiet: QuietHours,
  hours = 24
): Promise<void> {
  if (Platform.OS === "web") return;
  const date = clampOutOfQuietHours(new Date(Date.now() + hours * 60 * 60 * 1000), quiet);
  await scheduleAt(date, data);
}

/** Register the interactive action buttons. Safe to call repeatedly. */
export async function registerGoalFollowupCategory(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.setNotificationCategoryAsync(FOLLOWUP_CATEGORY, [
    // All actions open the app: Android's cached-app freezer + the remote-only
    // background task mean opensAppToForeground:false silent actions don't reliably
    // fire for local notifications. The in-app response listener handles them.
    {
      identifier: FOLLOWUP_ACTION_COMPLETE,
      buttonTitle: "✓ Mark complete",
      options: { opensAppToForeground: true },
    },
    {
      identifier: FOLLOWUP_ACTION_RESCHEDULE,
      buttonTitle: "Reschedule",
      options: { opensAppToForeground: true },
    },
    {
      identifier: FOLLOWUP_ACTION_SNOOZE,
      buttonTitle: "Snooze 1 day",
      options: { opensAppToForeground: true },
    },
  ]).catch(() => {});
}
