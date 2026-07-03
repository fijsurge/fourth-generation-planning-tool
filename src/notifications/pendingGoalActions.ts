import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { getWeeklyGoalsByWeek, updateWeeklyGoal } from "../api/googleSheets";
import { cancelGoalFollowup } from "./goalNotifications";

/**
 * Queue of "mark goal complete" actions taken from a notification action button.
 *
 * The button uses opensAppToForeground:false, so the handler runs without opening
 * the app — but if the network call fails (offline, killed app), we persist the
 * intent here and flush it on the next launch so a tap is never silently lost.
 */

const PENDING_KEY = "pendingGoalCompletions";

interface PendingComplete {
  goalId: string;
  weekStartDate: string;
}

async function read(): Promise<PendingComplete[]> {
  if (Platform.OS === "web") return [];
  try {
    const raw = await SecureStore.getItemAsync(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function write(items: PendingComplete[]): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    if (items.length === 0) {
      await SecureStore.deleteItemAsync(PENDING_KEY);
    } else {
      await SecureStore.setItemAsync(PENDING_KEY, JSON.stringify(items));
    }
  } catch {
    // Best-effort persistence
  }
}

async function enqueue(item: PendingComplete): Promise<void> {
  const items = await read();
  if (items.some((i) => i.goalId === item.goalId)) return;
  items.push(item);
  await write(items);
}

/** Queue a completion for later (e.g. when no token is available to act now). */
export async function enqueuePendingCompletion(goalId: string, weekStartDate: string): Promise<void> {
  await enqueue({ goalId, weekStartDate });
}

/** Mark a goal complete in the sheet and cancel its follow-up. Throws on failure. */
async function markComplete(token: string, goalId: string, weekStartDate: string): Promise<void> {
  const goals = await getWeeklyGoalsByWeek(token, weekStartDate);
  const goal = goals.find((g) => g.id === goalId);
  if (goal && goal.status !== "complete") {
    await updateWeeklyGoal(token, {
      ...goal,
      status: "complete",
      updatedAt: new Date().toISOString(),
    });
  }
  await cancelGoalFollowup(goalId);
}

/**
 * Complete a goal in response to a notification action. On network failure, queue
 * it for retry on next launch. Returns true on success.
 */
export async function completeGoalFromNotification(
  token: string,
  goalId: string,
  weekStartDate: string
): Promise<boolean> {
  try {
    await markComplete(token, goalId, weekStartDate);
    return true;
  } catch {
    await enqueue({ goalId, weekStartDate });
    return false;
  }
}

/** Flush any queued completions. Call once a valid token is available. */
export async function flushPendingCompletions(token: string): Promise<void> {
  if (Platform.OS === "web") return;
  const items = await read();
  if (items.length === 0) return;
  const remaining: PendingComplete[] = [];
  for (const item of items) {
    try {
      await markComplete(token, item.goalId, item.weekStartDate);
    } catch {
      remaining.push(item);
    }
  }
  await write(remaining);
}
