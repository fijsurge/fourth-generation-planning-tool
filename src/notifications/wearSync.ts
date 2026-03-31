import { NativeModules, Platform } from "react-native";
import { WeeklyGoal } from "../models/WeeklyGoal";

interface WearGoal {
  text: string;
  quadrant: number;
}

/**
 * Push today's Q1+Q2 incomplete goals to the Pixel Watch via Wearable DataLayer.
 * No-ops on non-Android platforms or if the native module is unavailable.
 */
export async function pushGoalsToWatch(goals: WeeklyGoal[]): Promise<void> {
  if (Platform.OS !== "android") return;

  const { WearDataModule } = NativeModules;
  if (!WearDataModule) return; // watch not paired or module not available

  const payload: WearGoal[] = goals
    .filter((g) => (g.quadrant === 1 || g.quadrant === 2) && g.status !== "complete")
    .slice(0, 8)
    .map((g) => ({ text: g.goalText, quadrant: g.quadrant }));

  try {
    await WearDataModule.pushGoalsToWatch(JSON.stringify(payload));
  } catch {
    // Silent fail — watch may not be connected
  }
}
