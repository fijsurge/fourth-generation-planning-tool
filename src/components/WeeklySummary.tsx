import { View, Text, StyleSheet } from "react-native";
import { WeeklyGoal, Quadrant } from "../models/WeeklyGoal";
import { QUADRANT_SHORT_LABELS, QUADRANT_COLORS } from "../utils/constants";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

interface WeeklySummaryProps {
  goals: WeeklyGoal[];
}

export function WeeklySummary({ goals }: WeeklySummaryProps) {
  if (goals.length === 0) return null;

  const complete = goals.filter((g) => g.status === "complete").length;
  const total = goals.length;

  // Count goals per quadrant (only those that exist)
  const quadrantCounts = new Map<Quadrant, number>();
  for (const goal of goals) {
    quadrantCounts.set(goal.quadrant, (quadrantCounts.get(goal.quadrant) || 0) + 1);
  }

  const parts: { label: string; color: string }[] = [];
  for (const q of [1, 2, 3, 4] as Quadrant[]) {
    const count = quadrantCounts.get(q);
    if (count) {
      parts.push({ label: `${count} ${QUADRANT_SHORT_LABELS[q]}`, color: QUADRANT_COLORS[q] });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.progressText}>
        {complete}/{total} complete
      </Text>
      {parts.length > 0 && <Text style={styles.separator}> — </Text>}
      {parts.map((part, i) => (
        <Text key={part.label}>
          {i > 0 && <Text style={styles.separator}>, </Text>}
          <Text style={[styles.quadrantText, { color: part.color }]}>{part.label}</Text>
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  separator: {
    fontSize: 13,
    color: colors.textMuted,
  },
  quadrantText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
