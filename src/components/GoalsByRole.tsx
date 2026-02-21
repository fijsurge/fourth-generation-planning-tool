import { useMemo, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Platform } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
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
  onDeleteGoal?: (goalId: string) => void;
  isLocked?: boolean;
  isLoading?: boolean;
}

function SwipeableGoalRow({
  goal,
  onGoalPress,
  onCycleStatus,
  onCalendarPress,
  onMoveOrCopy,
  onDeleteGoal,
  isLocked,
  colors,
}: {
  goal: WeeklyGoal;
  onGoalPress: (goal: WeeklyGoal) => void;
  onCycleStatus: (goalId: string) => void;
  onCalendarPress?: (goal: WeeklyGoal) => void;
  onMoveOrCopy?: (goal: WeeklyGoal) => void;
  onDeleteGoal?: (goalId: string) => void;
  isLocked?: boolean;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const handleDelete = () => {
    swipeRef.current?.close();
    if (Platform.OS === "web") {
      if (window.confirm("Delete this goal?")) {
        onDeleteGoal?.(goal.id);
      }
    } else {
      Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDeleteGoal?.(goal.id) },
      ]);
    }
  };

  const renderRightActions = () => (
    <Pressable
      onPress={handleDelete}
      style={{
        backgroundColor: colors.danger,
        justifyContent: "center",
        alignItems: "center",
        width: 80,
      }}
    >
      <Ionicons name="trash-outline" size={22} color="#fff" />
      <Text style={{ color: "#fff", fontSize: 12, marginTop: 2 }}>Delete</Text>
    </Pressable>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions}>
      <GoalItem
        goal={goal}
        onPress={() => onGoalPress(goal)}
        onCycleStatus={() => onCycleStatus(goal.id)}
        onCalendarPress={onCalendarPress ? () => onCalendarPress(goal) : undefined}
        onMoveOrCopy={onMoveOrCopy ? () => onMoveOrCopy(goal) : undefined}
        onDelete={onDeleteGoal ? () => handleDelete() : undefined}
        isLocked={isLocked}
      />
    </Swipeable>
  );
}

export function GoalsByRole({ goals, roles, onGoalPress, onCycleStatus, onCalendarPress, onMoveOrCopy, onDeleteGoal, isLocked, isLoading }: GoalsByRoleProps) {
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

  if (isLoading) {
    return <GoalSkeleton count={3} colors={colors} />;
  }

  if (sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>No goals this week.</Text>
        <Text style={styles.emptyHint}>Tap + to plan your most important work.</Text>
      </View>
    );
  }

  return (
    <View>
      {sections.map((section) => (
        <View key={section.label} style={styles.section}>
          <Text style={styles.header}>{section.label}</Text>
          {section.goals.map((goal) =>
            Platform.OS !== "web" && !isLocked && onDeleteGoal ? (
              <SwipeableGoalRow
                key={goal.id}
                goal={goal}
                onGoalPress={onGoalPress}
                onCycleStatus={onCycleStatus}
                onCalendarPress={onCalendarPress}
                onMoveOrCopy={onMoveOrCopy}
                onDeleteGoal={onDeleteGoal}
                isLocked={isLocked}
                colors={colors}
              />
            ) : (
              <GoalItem
                key={goal.id}
                goal={goal}
                onPress={() => onGoalPress(goal)}
                onCycleStatus={() => onCycleStatus(goal.id)}
                onCalendarPress={onCalendarPress ? () => onCalendarPress(goal) : undefined}
                onMoveOrCopy={onMoveOrCopy ? () => onMoveOrCopy(goal) : undefined}
                onDelete={Platform.OS === "web" && onDeleteGoal && !isLocked ? () => {
                  if (window.confirm("Delete this goal?")) {
                    onDeleteGoal(goal.id);
                  }
                } : undefined}
                isLocked={isLocked}
              />
            )
          )}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// GoalSkeleton — shimmer loading placeholder
// ---------------------------------------------------------------------------
function GoalSkeleton({ count = 3, colors }: { count?: number; colors: ReturnType<typeof useThemeColors> }) {
  const rows = Array.from({ length: count });
  return (
    <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
      {rows.map((_, i) => (
        <View key={i} style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: spacing.sm,
        }}>
          <View style={{ flex: 1, height: 14, backgroundColor: colors.border, borderRadius: 4, opacity: 0.5 }} />
          <View style={{ width: 32, height: 20, backgroundColor: colors.border, borderRadius: 4, opacity: 0.4 }} />
          <View style={{ width: 32, height: 20, backgroundColor: colors.border, borderRadius: 4, opacity: 0.4 }} />
        </View>
      ))}
    </View>
  );
}
