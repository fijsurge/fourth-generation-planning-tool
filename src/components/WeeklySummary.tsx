import { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WeeklyGoal, Quadrant } from "../models/WeeklyGoal";
import { QUADRANT_LABELS, QUADRANT_SHORT_LABELS, getQuadrantColors } from "../utils/constants";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing } from "../theme/spacing";

interface WeeklySummaryProps {
  goals: WeeklyGoal[];
}

export function WeeklySummary({ goals }: WeeklySummaryProps) {
  const colors = useThemeColors();
  const QUADRANT_COLORS = getQuadrantColors(colors);
  const [expanded, setExpanded] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    outerContainer: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
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
    chevron: {
      marginLeft: "auto" as any,
      paddingLeft: spacing.sm,
    },
    breakdown: {
      paddingBottom: spacing.xs,
    },
    quadrantRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: 3,
      gap: spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      flexShrink: 0,
    },
    quadrantRowLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
    },
    quadrantCount: {
      fontSize: 12,
      color: colors.textMuted,
      minWidth: 40,
      textAlign: "right",
    },
    barTrack: {
      width: 60,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    barFill: {
      height: 6,
      borderRadius: 3,
    },
    pctText: {
      fontSize: 12,
      color: colors.textMuted,
      width: 32,
      textAlign: "right",
    },
  }), [colors]);

  if (goals.length === 0) return null;

  const complete = goals.filter((g) => g.status === "complete").length;
  const total = goals.length;

  const quadrantCounts = new Map<Quadrant, number>();
  const quadrantComplete = new Map<Quadrant, number>();
  for (const goal of goals) {
    quadrantCounts.set(goal.quadrant, (quadrantCounts.get(goal.quadrant) || 0) + 1);
    if (goal.status === "complete") {
      quadrantComplete.set(goal.quadrant, (quadrantComplete.get(goal.quadrant) || 0) + 1);
    }
  }

  const parts: { label: string; color: string }[] = [];
  for (const q of [1, 2, 3, 4] as Quadrant[]) {
    const count = quadrantCounts.get(q);
    if (count) {
      parts.push({ label: `${count} ${QUADRANT_SHORT_LABELS[q]}`, color: QUADRANT_COLORS[q] });
    }
  }

  return (
    <View style={styles.outerContainer}>
      <Pressable style={styles.headerRow} onPress={() => setExpanded((e) => !e)}>
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
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.textMuted}
          style={styles.chevron}
        />
      </Pressable>

      {expanded && (
        <View style={styles.breakdown}>
          {([1, 2, 3, 4] as Quadrant[]).map((q) => {
            const qTotal = quadrantCounts.get(q) || 0;
            const qComplete = quadrantComplete.get(q) || 0;
            const pct = qTotal > 0 ? Math.round((qComplete / qTotal) * 100) : 0;
            return (
              <View key={q} style={styles.quadrantRow}>
                <View style={[styles.dot, { backgroundColor: QUADRANT_COLORS[q] }]} />
                <Text style={styles.quadrantRowLabel} numberOfLines={1}>
                  {QUADRANT_LABELS[q]}
                </Text>
                <Text style={styles.quadrantCount}>{qComplete}/{qTotal}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct}%` as any, backgroundColor: QUADRANT_COLORS[q] },
                    ]}
                  />
                </View>
                <Text style={styles.pctText}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
