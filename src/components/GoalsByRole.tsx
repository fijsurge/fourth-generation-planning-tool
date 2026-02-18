import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { WeeklyGoal } from "../models/WeeklyGoal";
import { Role } from "../models/Role";
import { GoalItem } from "./GoalItem";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing } from "../theme/spacing";

interface GoalsByRoleProps {
  goals: WeeklyGoal[];
  roles: Role[];
  onGoalPress: (goal: WeeklyGoal) => void;
  onCycleStatus: (goalId: string) => void;
  onCalendarPress?: (goal: WeeklyGoal) => void;
  onMoveOrCopy?: (goal: WeeklyGoal) => void;
  isLocked?: boolean;
}

export function GoalsByRole({ goals, roles, onGoalPress, onCycleStatus, onCalendarPress, onMoveOrCopy, isLocked }: GoalsByRoleProps) {
  const colors = useThemeColors();
  const roleMap = new Map(roles.filter((r) => r.active).map((r) => [r.id, r]));

  // Group goals by role
  const grouped = new Map<string, WeeklyGoal[]>();
  for (const goal of goals) {
    const key = roleMap.has(goal.roleId) ? goal.roleId : "__unassigned__";
    const list = grouped.get(key) || [];
    list.push(goal);
    grouped.set(key, list);
  }

  // Build ordered sections: active roles first (by sortOrder), then unassigned
  const sections: { label: string; goals: WeeklyGoal[] }[] = [];
  const sortedRoles = [...roleMap.values()].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const role of sortedRoles) {
    const roleGoals = grouped.get(role.id);
    if (roleGoals?.length) {
      sections.push({ label: role.name, goals: roleGoals });
    }
  }

  const unassigned = grouped.get("__unassigned__");
  if (unassigned?.length) {
    sections.push({ label: "Unassigned", goals: unassigned });
  }

  const styles = useMemo(() => StyleSheet.create({
    section: {
      marginBottom: spacing.sm,
    },
    header: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
    },
    empty: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: spacing.xxl,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    emptyHint: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: spacing.xs,
    },
  }), [colors]);

  if (sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No goals this week.</Text>
        <Text style={styles.emptyHint}>Tap + to add your first goal.</Text>
      </View>
    );
  }

  return (
    <View>
      {sections.map((section) => (
        <View key={section.label} style={styles.section}>
          <Text style={styles.header}>{section.label}</Text>
          {section.goals.map((goal) => (
            <GoalItem
              key={goal.id}
              goal={goal}
              onPress={() => onGoalPress(goal)}
              onCycleStatus={() => onCycleStatus(goal.id)}
              onCalendarPress={onCalendarPress ? () => onCalendarPress(goal) : undefined}
              onMoveOrCopy={onMoveOrCopy ? () => onMoveOrCopy(goal) : undefined}
              isLocked={isLocked}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
