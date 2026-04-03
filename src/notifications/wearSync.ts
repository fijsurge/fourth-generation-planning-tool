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

  const payload: WearGoal[] = goals
    .filter((g) => g.quadrant === 1 || g.quadrant === 2)
    .map((g) => ({
      id: g.id,
      text: g.goalText,
      quadrant: g.quadrant,
      roleName: roleMap.get(g.roleId) ?? "",
      status: g.status,
    }));

  try {
    await WearDataModule.pushGoalsToWatch(JSON.stringify(payload));
  } catch {
    // Silent fail — watch may not be connected
  }
}
