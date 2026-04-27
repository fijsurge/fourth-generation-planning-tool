import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { WeeklyGoal } from "../models/WeeklyGoal";
import { Role } from "../models/Role";

interface WearGoal {
  id: string;
  text: string;
  quadrant: number;
  roleName: string;
  status: string;
  isBigRock: boolean;
  priority?: number;
}

// Expo Modules API — works with New Architecture (bridgeless mode)
const WearDataModule = (() => {
  try {
    return requireOptionalNativeModule("WearDataModule");
  } catch {
    return null;
  }
})();

/**
 * Push all Q1+Q2 goals (with status) to the Pixel Watch via Wearable DataLayer.
 * All statuses are included so the tile can show complete/in-progress/not-started.
 * No-ops on non-Android platforms or if the native module is unavailable.
 */
export async function pushGoalsToWatch(goals: WeeklyGoal[], roles: Role[]): Promise<void> {
  if (Platform.OS !== "android") return;
  if (!WearDataModule) {
    console.warn("[WearSync] WearDataModule not available — skipping push");
    return;
  }

  const roleMap = new Map(roles.map((r) => [r.id, r.name]));

  // Deduplicate recurring goals — pre-existing duplicate rows from the old
  // carry bug should appear as one on the watch (matches phone display dedup).
  const seen = new Set<string>();
  const deduped = goals.filter((g) => {
    if (!g.recurring) return true;
    const key = `${g.roleId}|${g.goalText}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const payload: WearGoal[] = deduped
    .filter((g) => g.quadrant === 1 || g.quadrant === 2)
    .map((g) => ({
      id: g.id,
      text: g.goalText,
      quadrant: g.quadrant,
      roleName: roleMap.get(g.roleId) ?? "",
      status: g.status,
      isBigRock: g.isBigRock ?? false,
      priority: g.priority,
    }));

  try {
    await WearDataModule.pushGoalsToWatch(JSON.stringify(payload));
  } catch {
    // Silent fail — watch may not be connected
  }
}
