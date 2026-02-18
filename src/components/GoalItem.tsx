import { useMemo } from "react";
import { Pressable, Text, View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WeeklyGoal } from "../models/WeeklyGoal";
import { QuadrantBadge } from "./QuadrantBadge";
import { StatusBadge } from "./StatusBadge";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";

interface GoalItemProps {
  goal: WeeklyGoal;
  onPress: () => void;
  onCycleStatus: () => void;
  onCalendarPress?: () => void;
  onMoveOrCopy?: () => void;
}

export function GoalItem({ goal, onPress, onCycleStatus, onCalendarPress, onMoveOrCopy }: GoalItemProps) {
  const colors = useThemeColors();
  const hasEvent = !!goal.calendarEventId;

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
    text: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      marginRight: spacing.sm,
    },
    textComplete: {
      textDecorationLine: "line-through",
      color: colors.textMuted,
    },
    badges: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    calendarButton: {
      padding: 2,
    },
  }), [colors]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onMoveOrCopy}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Text
        style={[styles.text, goal.status === "complete" && styles.textComplete]}
        numberOfLines={2}
      >
        {goal.goalText}
      </Text>
      <View style={styles.badges}>
        {onCalendarPress && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onCalendarPress();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.calendarButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons
              name={hasEvent ? "calendar" : "calendar-outline"}
              size={18}
              color={hasEvent ? colors.primary : colors.textMuted}
            />
          </Pressable>
        )}
        {Platform.OS === "web" && onMoveOrCopy && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onMoveOrCopy();
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.calendarButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons name="arrow-redo-outline" size={18} color={colors.textMuted} />
          </Pressable>
        )}
        <QuadrantBadge quadrant={goal.quadrant} />
        <StatusBadge status={goal.status} onPress={onCycleStatus} />
      </View>
    </Pressable>
  );
}
