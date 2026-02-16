import { Pressable, Text, StyleSheet } from "react-native";
import { GoalStatus } from "../models/WeeklyGoal";
import { getStatusColors, STATUS_LABELS } from "../utils/constants";
import { useThemeColors } from "../theme/useThemeColors";
import { borderRadius, spacing } from "../theme/spacing";

interface StatusBadgeProps {
  status: GoalStatus;
  onPress?: () => void;
}

export function StatusBadge({ status, onPress }: StatusBadgeProps) {
  const colors = useThemeColors();
  const STATUS_COLORS = getStatusColors(colors);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.badge,
        { backgroundColor: STATUS_COLORS[status] + "20", borderColor: STATUS_COLORS[status] },
        pressed && onPress && { opacity: 0.7 },
      ]}
      hitSlop={8}
    >
      <Text style={[styles.label, { color: STATUS_COLORS[status] }]}>
        {STATUS_LABELS[status]}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
