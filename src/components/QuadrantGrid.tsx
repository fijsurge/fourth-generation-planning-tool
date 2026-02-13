import { View, StyleSheet } from "react-native";
import { WeeklyGoal, Quadrant } from "../models/WeeklyGoal";
import { Role } from "../models/Role";
import { QuadrantCell } from "./QuadrantCell";
import { spacing } from "../theme/spacing";

interface QuadrantGridProps {
  goals: WeeklyGoal[];
  roles: Role[];
  onGoalPress: (goal: WeeklyGoal) => void;
  onCycleStatus: (goalId: string) => void;
}

export function QuadrantGrid({ goals, roles, onGoalPress, onCycleStatus }: QuadrantGridProps) {
  // Single-pass partition into 4 arrays
  const byQuadrant: Record<Quadrant, WeeklyGoal[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const goal of goals) {
    byQuadrant[goal.quadrant].push(goal);
  }

  return (
    <View style={styles.grid}>
      {/* Row 1: Important */}
      <View style={styles.row}>
        <QuadrantCell quadrant={1} goals={byQuadrant[1]} roles={roles} onGoalPress={onGoalPress} onCycleStatus={onCycleStatus} />
        <QuadrantCell quadrant={2} goals={byQuadrant[2]} roles={roles} onGoalPress={onGoalPress} onCycleStatus={onCycleStatus} emphasized />
      </View>
      {/* Row 2: Not Important */}
      <View style={styles.row}>
        <QuadrantCell quadrant={3} goals={byQuadrant[3]} roles={roles} onGoalPress={onGoalPress} onCycleStatus={onCycleStatus} />
        <QuadrantCell quadrant={4} goals={byQuadrant[4]} roles={roles} onGoalPress={onGoalPress} onCycleStatus={onCycleStatus} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
  },
});
