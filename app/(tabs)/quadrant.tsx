import { useState, useCallback } from "react";
import { View, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWeeklyGoals } from "../../src/hooks/useWeeklyGoals";
import { useRoles } from "../../src/hooks/useRoles";
import { WeekSelector } from "../../src/components/WeekSelector";
import { WeeklySummary } from "../../src/components/WeeklySummary";
import { QuadrantGrid } from "../../src/components/QuadrantGrid";
import { WeeklyGoal } from "../../src/models/WeeklyGoal";
import { getWeekStart, shiftWeek, formatWeekKey } from "../../src/utils/dates";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";

export default function QuadrantScreen() {
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
        <QuadrantGrid
          goals={goals}
          roles={roles}
          onGoalPress={handleGoalPress}
          onCycleStatus={cycleStatus}
        />
      )}

      <Pressable
        onPress={handleAddGoal}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
