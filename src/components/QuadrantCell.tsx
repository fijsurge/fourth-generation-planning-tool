import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { WeeklyGoal, Quadrant } from "../models/WeeklyGoal";
import { Role } from "../models/Role";
import { StatusBadge } from "./StatusBadge";
import { QUADRANT_LABELS, getQuadrantColors } from "../utils/constants";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";

interface QuadrantCellProps {
  quadrant: Quadrant;
  goals: WeeklyGoal[];
  roles: Role[];
  emphasized?: boolean;
  onGoalPress: (goal: WeeklyGoal) => void;
  onCycleStatus: (goalId: string) => void;
}

export function QuadrantCell({
  quadrant,
  goals,
  roles,
  emphasized,
  onGoalPress,
  onCycleStatus,
}: QuadrantCellProps) {
  const colors = useThemeColors();
  const QUADRANT_COLORS = getQuadrantColors(colors);
  const qColor = QUADRANT_COLORS[quadrant];
  const roleMap = new Map(roles.map((r) => [r.id, r.name]));

  const styles = useMemo(() => StyleSheet.create({
    cell: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 2,
    },
    headerText: {
      fontSize: 12,
      fontWeight: "700",
      flex: 1,
    },
    countBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      marginLeft: spacing.xs,
    },
    countText: {
      fontSize: 11,
      fontWeight: "700",
    },
    list: {
      flex: 1,
    },
    empty: {
      padding: spacing.md,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
      fontStyle: "italic",
    },
    goalRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    goalInfo: {
      flex: 1,
      marginRight: spacing.xs,
    },
    goalText: {
      fontSize: 13,
      color: colors.text,
    },
    goalTextComplete: {
      textDecorationLine: "line-through",
      color: colors.textMuted,
    },
    roleName: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
  }), [colors]);

  return (
    <View
      style={[
        styles.cell,
        emphasized && {
          backgroundColor: colors.quadrant.q2 + "08",
          borderLeftWidth: 3,
          borderLeftColor: colors.quadrant.q2,
        },
      ]}
    >
      <View style={[styles.header, { backgroundColor: qColor + (emphasized ? "20" : "15") }]}>
        <Text style={[styles.headerText, { color: qColor }]} numberOfLines={1}>
          {QUADRANT_LABELS[quadrant]}
        </Text>
        <View style={[styles.countBadge, { backgroundColor: qColor + "25" }]}>
          <Text style={[styles.countText, { color: qColor }]}>{goals.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.list} nestedScrollEnabled>
        {goals.length === 0 ? (
          <Text style={styles.empty}>No goals</Text>
        ) : (
          goals.map((goal) => (
            <Pressable
              key={goal.id}
              onPress={() => onGoalPress(goal)}
              style={({ pressed }) => [styles.goalRow, pressed && { opacity: 0.7 }]}
            >
              <View style={styles.goalInfo}>
                <Text
                  style={[styles.goalText, goal.status === "complete" && styles.goalTextComplete]}
                  numberOfLines={2}
                >
                  {goal.goalText}
                </Text>
                <Text style={styles.roleName} numberOfLines={1}>
                  {roleMap.get(goal.roleId) ?? "No role"}
                </Text>
              </View>
              <StatusBadge status={goal.status} onPress={() => onCycleStatus(goal.id)} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}
