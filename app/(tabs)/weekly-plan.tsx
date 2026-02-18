import { useState, useCallback, useMemo } from "react";
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWeeklyGoals } from "../../src/hooks/useWeeklyGoals";
import { useRoles } from "../../src/hooks/useRoles";
import { WeekSelector } from "../../src/components/WeekSelector";
import { WeeklySummary } from "../../src/components/WeeklySummary";
import { GoalsByRole } from "../../src/components/GoalsByRole";
import { WeekPickerModal } from "../../src/components/WeekPickerModal";
import { WeeklyGoal } from "../../src/models/WeeklyGoal";
import { getWeekStart, shiftWeek, formatWeekKey } from "../../src/utils/dates";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { spacing } from "../../src/theme/spacing";

export default function WeeklyPlanScreen() {
  const colors = useThemeColors();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const weekKey = formatWeekKey(weekStart);
  const [moveOrCopyGoal, setMoveOrCopyGoal] = useState<WeeklyGoal | null>(null);

  const { goals, isLoading: goalsLoading, cycleStatus, moveGoalToWeek, copyGoalToWeek, refresh: refreshGoals } = useWeeklyGoals(weekKey);
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

  const handleMoveOrCopy = (goal: WeeklyGoal) => setMoveOrCopyGoal(goal);

  const handleMove = async (targetWeekDate: string) => {
    if (!moveOrCopyGoal) return;
    setMoveOrCopyGoal(null);
    await moveGoalToWeek(moveOrCopyGoal.id, targetWeekDate);
  };

  const handleCopy = async (targetWeekDate: string) => {
    if (!moveOrCopyGoal) return;
    setMoveOrCopyGoal(null);
    await copyGoalToWeek(moveOrCopyGoal.id, targetWeekDate);
  };

  const handleCalendarPress = (goal: WeeklyGoal) => {
    if (goal.calendarEventId) {
      router.push(`/event/${goal.calendarEventId}`);
    } else {
      router.push(
        `/event/new?goalId=${goal.id}&goalText=${encodeURIComponent(goal.goalText)}&weekStartDate=${weekKey}`
      );
    }
  };

  const isLoading = goalsLoading || rolesLoading;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
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
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator>
          <GoalsByRole
            goals={goals}
            roles={roles}
            onGoalPress={handleGoalPress}
            onCycleStatus={cycleStatus}
            onCalendarPress={handleCalendarPress}
            onMoveOrCopy={handleMoveOrCopy}
          />
        </ScrollView>
      )}

      <Pressable
        onPress={handleAddGoal}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}
      >
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </Pressable>

      <WeekPickerModal
        visible={!!moveOrCopyGoal}
        currentWeekStart={weekStart}
        onMove={handleMove}
        onCopy={handleCopy}
        onClose={() => setMoveOrCopyGoal(null)}
      />
    </View>
  );
}
