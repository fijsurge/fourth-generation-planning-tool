import { Quadrant, GoalStatus } from "../models/WeeklyGoal";
import { colors } from "../theme/colors";

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  1: "Q1: Urgent & Important",
  2: "Q2: Not Urgent & Important",
  3: "Q3: Urgent & Not Important",
  4: "Q4: Not Urgent & Not Important",
};

export const QUADRANT_SHORT_LABELS: Record<Quadrant, string> = {
  1: "Q1",
  2: "Q2",
  3: "Q3",
  4: "Q4",
};

export const QUADRANT_COLORS: Record<Quadrant, string> = {
  1: colors.quadrant.q1,
  2: colors.quadrant.q2,
  3: colors.quadrant.q3,
  4: colors.quadrant.q4,
};

export const STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
};

export const STATUS_COLORS: Record<GoalStatus, string> = {
  not_started: colors.status.not_started,
  in_progress: colors.status.in_progress,
  complete: colors.status.complete,
};

// Cycle order for tapping status badge
export const STATUS_CYCLE: GoalStatus[] = [
  "not_started",
  "in_progress",
  "complete",
];
