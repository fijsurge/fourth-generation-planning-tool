import { Pressable, Text, View, StyleSheet } from "react-native";
import { WeeklyGoal } from "../models/WeeklyGoal";
import { QuadrantBadge } from "./QuadrantBadge";
import { StatusBadge } from "./StatusBadge";
import { colors } from "../theme/colors";
import { spacing, borderRadius } from "../theme/spacing";

interface GoalItemProps {
  goal: WeeklyGoal;
  onPress: () => void;
  onCycleStatus: () => void;
}

export function GoalItem({ goal, onPress, onCycleStatus }: GoalItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Text
        style={[styles.text, goal.status === "complete" && styles.textComplete]}
        numberOfLines={2}
      >
        {goal.goalText}
      </Text>
      <View style={styles.badges}>
        <QuadrantBadge quadrant={goal.quadrant} />
        <StatusBadge status={goal.status} onPress={onCycleStatus} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
});
