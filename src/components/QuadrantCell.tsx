import { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WeeklyGoal, Quadrant } from "../models/WeeklyGoal";
import { Role } from "../models/Role";
import { StatusBadge } from "./StatusBadge";
import { QUADRANT_LABELS, getQuadrantColors } from "../utils/constants";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";
import { typography } from "../theme/typography";
import { elevation } from "../theme/elevation";

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
  const qSoft = colors.quadrantSoft[`q${quadrant}` as "q1" | "q2" | "q3" | "q4"];
  const qSofter = colors.quadrantSofter[`q${quadrant}` as "q1" | "q2" | "q3" | "q4"];
  const roleMap = new Map(roles.map((r) => [r.id, r.name]));

  const styles = useMemo(() => StyleSheet.create({
    cell: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    cellEmphasized: {
      backgroundColor: colors.quadrantSofter.q2,
      borderColor: colors.quadrant.q2,
      ...elevation.sm,
      shadowColor: colors.shadow,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
    },
    headerText: {
      ...typography.caption,
      fontWeight: "700",
      flex: 1,
    },
    countBadge: {
      minWidth: 22,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
      marginLeft: spacing.xs,
    },
    countText: {
      ...typography.micro,
      fontWeight: "700",
    },
    list: {
      flex: 1,
    },
    empty: {
      padding: spacing.md,
      ...typography.bodySm,
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
      ...typography.bodySm,
      color: colors.text,
    },
    goalTextComplete: {
      textDecorationLine: "line-through",
      color: colors.textMuted,
    },
    roleName: {
      ...typography.micro,
      color: colors.textMuted,
      marginTop: 1,
    },
  }), [colors]);

  return (
    <View style={[styles.cell, emphasized && styles.cellEmphasized]}>
      <View style={[styles.header, { backgroundColor: emphasized ? qSoft : qSofter }]}>
        <Text style={[styles.headerText, { color: qColor }]} numberOfLines={1}>
          {QUADRANT_LABELS[quadrant]}
        </Text>
        <View style={[styles.countBadge, { backgroundColor: qSoft }]}>
          <Text style={[styles.countText, { color: qColor }]}>{goals.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.list} nestedScrollEnabled>
        {goals.length === 0 ? (
          <View style={{ alignItems: "center", padding: spacing.md }}>
            <Ionicons name="add-circle-outline" size={20} color={colors.textMuted} />
          </View>
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
