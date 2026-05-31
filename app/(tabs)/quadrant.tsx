import { useState, useCallback, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWeeklyGoals } from "../../src/hooks/useWeeklyGoals";
import { useRoles } from "../../src/hooks/useRoles";
import { WeekSelector } from "../../src/components/WeekSelector";
import { WeeklySummary } from "../../src/components/WeeklySummary";
import { QuadrantGrid } from "../../src/components/QuadrantGrid";
import { WeeklyGoal } from "../../src/models/WeeklyGoal";
import { getWeekStart, shiftWeek, formatWeekKey } from "../../src/utils/dates";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function QuadrantScreen() {
  const colors = useThemeColors();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const weekKey = formatWeekKey(weekStart);

  const { goals, isLoading: goalsLoading, cycleStatus, refresh: refreshGoals } = useWeeklyGoals(weekKey);
  const { roles, isLoading: rolesLoading, refresh: refreshRoles } = useRoles();

  useFocusEffect(
    useCallback(() => {
      refreshGoals();
      refreshRoles();
    }, [refreshGoals, refreshRoles])
  );

  const handlePrevWeek = () => setWeekStart((prev) => shiftWeek(prev, -1));
  const handleNextWeek = () => setWeekStart((prev) => shiftWeek(prev, 1));
  const handleToday = () => setWeekStart(getWeekStart(new Date()));

  const handleGoalPress = (goal: WeeklyGoal) => {
    router.push(`/goal/${goal.id}?weekStartDate=${weekKey}`);
  };

  const handleAddGoal = () => {
    router.push(`/goal/new?weekStartDate=${weekKey}`);
  };

  const isLoading = goalsLoading || rolesLoading;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loader: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    fab: {
      position: "absolute",
      bottom: spacing.lg,
      right: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    emptyHint: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
      gap: spacing.xs,
      alignItems: "flex-start",
    },
    emptyHintTitle: {
      ...typography.bodyLg,
      fontWeight: "700",
      color: colors.primary,
    },
    emptyHintBody: {
      ...typography.body,
      color: colors.text,
      lineHeight: 20,
    },
    emptyHintCta: {
      marginTop: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    emptyHintCtaText: {
      ...typography.caption,
      fontWeight: "700",
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <WeekSelector
        weekStart={weekStart}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
      />
      <WeeklySummary goals={goals} />

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {goals.length === 0 && (
            <View style={styles.emptyHint}>
              <Ionicons name="grid-outline" size={20} color={colors.primary} />
              <Text style={styles.emptyHintTitle}>Nothing in your quadrants yet</Text>
              <Text style={styles.emptyHintBody}>
                Goals you add appear here, sorted by urgent vs. important. The top-right
                (Q2) is the magic zone — that's where the framework wants you to spend
                your planning effort.
              </Text>
              <Pressable
                onPress={handleAddGoal}
                style={({ pressed }) => [
                  styles.emptyHintCta,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.emptyHintCtaText, { color: colors.onPrimary }]}>
                  Add your first goal
                </Text>
              </Pressable>
            </View>
          )}
          <QuadrantGrid
            goals={goals}
            roles={roles}
            onGoalPress={handleGoalPress}
            onCycleStatus={cycleStatus}
          />
        </>
      )}

      <Pressable
        onPress={handleAddGoal}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}
      >
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}
