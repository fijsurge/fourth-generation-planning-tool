import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatWeekRange } from "../utils/dates";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";
import { typography } from "../theme/typography";

interface WeekSelectorProps {
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function WeekSelector({ weekStart, onPrevWeek, onNextWeek, onToday }: WeekSelectorProps) {
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    arrow: {
      padding: spacing.xs,
      borderRadius: borderRadius.md,
    },
    range: {
      ...typography.bodyLg,
      color: colors.text,
    },
    todayLink: {
      ...typography.bodySm,
      fontWeight: "500",
      color: colors.primary,
      marginTop: spacing.xs,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable onPress={onPrevWeek} hitSlop={8} style={styles.arrow}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.range}>{formatWeekRange(weekStart)}</Text>
        <Pressable onPress={onNextWeek} hitSlop={8} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </Pressable>
      </View>
      <Pressable onPress={onToday} hitSlop={4}>
        <Text style={styles.todayLink}>Today</Text>
      </Pressable>
    </View>
  );
}
