import { View, Text, StyleSheet } from "react-native";
import { Quadrant } from "../models/WeeklyGoal";
import { getQuadrantColors, QUADRANT_SHORT_LABELS } from "../utils/constants";
import { useThemeColors } from "../theme/useThemeColors";
import { borderRadius, spacing } from "../theme/spacing";

interface QuadrantBadgeProps {
  quadrant: Quadrant;
}

export function QuadrantBadge({ quadrant }: QuadrantBadgeProps) {
  const colors = useThemeColors();
  const QUADRANT_COLORS = getQuadrantColors(colors);

  return (
    <View style={[styles.badge, { backgroundColor: QUADRANT_COLORS[quadrant] + "20" }]}>
      <Text style={[styles.label, { color: QUADRANT_COLORS[quadrant] }]}>
        {QUADRANT_SHORT_LABELS[quadrant]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
