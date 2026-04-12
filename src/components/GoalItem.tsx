import { useMemo } from "react";
import { Pressable, Text, View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WeeklyGoal } from "../models/WeeklyGoal";
import { QuadrantBadge } from "./QuadrantBadge";
import { StatusBadge } from "./StatusBadge";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";

const BIG_ROCK_COLOR = "#F59E0B"; // amber — visible in both light and dark

interface GoalItemProps {
  goal: WeeklyGoal;
  onPress: () => void;
  onCycleStatus: () => void;
  onCalendarPress?: () => void;
  onMoveOrCopy?: () => void;
  onDelete?: () => void;
  isLocked?: boolean;
  roleName?: string; // shown as subtitle when displaying goals across roles (Big Rocks section)
}

export function GoalItem({ goal, onPress, onCycleStatus, onCalendarPress, onMoveOrCopy, onDelete, isLocked, roleName }: GoalItemProps) {
  const colors = useThemeColors();
  const hasEvent = !!goal.calendarEventId;
  const showIndicator = goal.isBigRock || goal.priority != null;

  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    indicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginRight: spacing.sm,
      minWidth: 28,
    },
    priorityText: {
      fontSize: 12,
      fontWeight: "700",
      color: BIG_ROCK_COLOR,
    },
    priorityTextRegular: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textMuted,
    },
    textBlock: {
      flex: 1,
      marginRight: spacing.sm,
    },
    text: {
      fontSize: 15,
      color: colors.text,
    },
    textComplete: {
      textDecorationLine: "line-through",
      color: colors.textMuted,
    },
    roleLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 1,
    },
    badges: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    iconButton: {
      padding: 2,
    },
  }), [colors]);

  const effectiveOnPress = isLocked ? undefined : onPress;
  const effectiveOnCycleStatus = isLocked ? () => {} : onCycleStatus;
  const effectiveOnCalendarPress = isLocked && !hasEvent ? undefined : onCalendarPress;

  return (
    <Pressable
      onPress={effectiveOnPress}
      onLongPress={onMoveOrCopy}
      style={({ pressed }) => [styles.row, !isLocked && pressed && { opacity: 0.7 }]}
    >
      {showIndicator && (
        <View style={styles.indicator}>
          {goal.isBigRock && (
            <Ionicons name="diamond" size={13} color={BIG_ROCK_COLOR} />
          )}
          {goal.priority != null && (
            <Text style={goal.isBigRock ? styles.priorityText : styles.priorityTextRegular}>
              {goal.priority}
            </Text>
          )}
        </View>
      )}

      <View style={styles.textBlock}>
        <Text
          style={[styles.text, goal.status === "complete" && styles.textComplete]}
          numberOfLines={2}
        >
          {goal.goalText}
        </Text>
        {roleName ? (
          <Text style={styles.roleLabel} numberOfLines={1}>{roleName}</Text>
        ) : null}
      </View>

      <View style={styles.badges}>
        {effectiveOnCalendarPress && (
          <Pressable
            onPress={(e) => { e.stopPropagation(); effectiveOnCalendarPress(); }}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons
              name={hasEvent ? "calendar" : "calendar-outline"}
              size={18}
              color={hasEvent ? colors.primary : colors.textSecondary}
            />
          </Pressable>
        )}
        {Platform.OS === "web" && onMoveOrCopy && (
          <Pressable
            onPress={(e) => { e.stopPropagation(); onMoveOrCopy(); }}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="arrow-redo-outline" size={18} color={colors.textMuted} />
          </Pressable>
        )}
        {Platform.OS === "web" && onDelete && !isLocked && (
          <Pressable
            onPress={(e) => { e.stopPropagation(); onDelete(); }}
            hitSlop={8}
            style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </Pressable>
        )}
        <QuadrantBadge quadrant={goal.quadrant} />
        <StatusBadge status={goal.status} onPress={effectiveOnCycleStatus} />
      </View>
    </Pressable>
  );
}
