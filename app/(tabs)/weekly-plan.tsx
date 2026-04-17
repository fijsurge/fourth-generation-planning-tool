import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator, Text, Alert, Platform } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWeeklyGoals } from "../../src/hooks/useWeeklyGoals";
import { useRoles } from "../../src/hooks/useRoles";
import { useAuth } from "../../src/auth/AuthContext";
import { useWeeklyReflection } from "../../src/hooks/useWeeklyReflection";
import { WeekSelector } from "../../src/components/WeekSelector";
import { WeeklySummary } from "../../src/components/WeeklySummary";
import { GoalsByRole } from "../../src/components/GoalsByRole";
import { WeekPickerModal } from "../../src/components/WeekPickerModal";
import { CloseoutModal } from "../../src/components/CloseoutModal";
import { WeeklyGoal } from "../../src/models/WeeklyGoal";
import { getWeekStart, shiftWeek, formatWeekKey } from "../../src/utils/dates";
import { generateId } from "../../src/utils/uuid";
import { getReflectionByWeek, getWeeklyGoals, addWeeklyGoal as apiAddGoal } from "../../src/api/googleSheets";
import { useSettings } from "../../src/contexts/SettingsContext";
import { scheduleDailyGoalReminder, scheduleCloseoutReminder, cancelAllScheduled } from "../../src/notifications/scheduler";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { spacing } from "../../src/theme/spacing";
import { goalEvents } from "../../src/utils/goalEvents";

export default function WeeklyPlanScreen() {
  const colors = useThemeColors();
  const { getValidAccessToken } = useAuth();
  const {
    notificationsEnabled, notificationTime,
    closeoutReminderEnabled, closeoutReminderDay, closeoutReminderTime,
  } = useSettings();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const weekKey = formatWeekKey(weekStart);
  const [moveOrCopyGoal, setMoveOrCopyGoal] = useState<WeeklyGoal | null>(null);
  const [showCloseout, setShowCloseout] = useState(false);
  const hasCheckedCloseout = useRef(false);

  // useMemo so prevWeekStart is a stable Date reference (not recreated each render).
  // An unstable Date in the useFocusEffect useCallback deps causes an infinite loop.
  const prevWeekStart = useMemo(() => shiftWeek(getWeekStart(new Date()), -1), []);
  const isCurrentWeek = formatWeekKey(weekStart) === formatWeekKey(getWeekStart(new Date()));

  const { goals, isLoading: goalsLoading, cycleStatus, deleteGoal, moveGoalToWeek, copyGoalToWeek, refresh: refreshGoals } = useWeeklyGoals(weekKey);
  const { roles, isLoading: rolesLoading, refresh: refreshRoles } = useRoles();

  // Refresh goals when any modal (new/edit goal) signals a successful save.
  // useFocusEffect is unreliable for modals on Android — this is the fallback.
  useEffect(() => goalEvents.onGoalSaved(() => refreshGoals()), [refreshGoals]);
  const {
    reflection: weekReflection,
    isLoading: reflectionLoading,
    deleteReflection: deleteWeekReflection,
  } = useWeeklyReflection(weekKey);

  // Separately check whether last week has been closed out, to control the
  // "Close out last week" button visibility when on the current week.
  const prevWeekKey = formatWeekKey(prevWeekStart);
  const { reflection: prevWeekReflection, isLoading: prevReflectionLoading, refresh: refreshPrevReflection } =
    useWeeklyReflection(prevWeekKey);

  // A week is locked once its reflection exists (i.e. it has been closed out).
  // We wait for the reflection check to finish before deciding — prevents a flash
  // where the FAB appears briefly on a locked week.
  const isLocked = !reflectionLoading && !!weekReflection;
  const showCloseoutButton =
    isCurrentWeek && !prevReflectionLoading && !prevWeekReflection;

  useFocusEffect(
    useCallback(() => {
      refreshGoals();
      refreshRoles();

      if (!hasCheckedCloseout.current && isCurrentWeek) {
        hasCheckedCloseout.current = true;
        const prevKey = formatWeekKey(prevWeekStart);
        (async () => {
          try {
            const token = await getValidAccessToken();
            const existing = await getReflectionByWeek(token, prevKey);
            if (!existing) setShowCloseout(true);
          } catch {
            // Silent fail — never block the user
          }
        })();
      }
    }, [refreshGoals, refreshRoles, getValidAccessToken, isCurrentWeek, prevWeekStart])
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

  const handleUndoCloseout = () => {
    const doUndo = async () => {
      try {
        await deleteWeekReflection();
      } catch {
        // deleteWeekReflection already sets error state; nothing more to do here
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Undo the closeout for this week?\n\nThe week will be unlocked for editing. The saved reflection will be deleted.")) {
        doUndo();
      }
    } else {
      Alert.alert(
        "Undo Closeout",
        "The week will be unlocked for editing. The saved reflection will be deleted.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Undo Closeout", style: "destructive", onPress: doUndo },
        ]
      );
    }
  };

  const handleDeleteGoal = useCallback(async (id: string) => {
    try {
      await deleteGoal(id);
    } catch {
      // deleteGoal handles rollback internally
    }
  }, [deleteGoal]);

  const handleCalendarPress = (goal: WeeklyGoal) => {
    if (goal.calendarEventId) {
      router.push(`/event/${goal.calendarEventId}`);
    } else {
      router.push(
        `/event/new?goalId=${goal.id}&goalText=${encodeURIComponent(goal.goalText)}&weekStartDate=${weekKey}&roleId=${goal.roleId}`
      );
    }
  };

  const isLoading = goalsLoading || rolesLoading;

  // Recurring carry state
  const carriedWeekRef = useRef<string | null>(null);
  const [recurringCarryCount, setRecurringCarryCount] = useState(0);

  useEffect(() => {
    if (recurringCarryCount > 0) {
      const t = setTimeout(() => setRecurringCarryCount(0), 3000);
      return () => clearTimeout(t);
    }
  }, [recurringCarryCount]);

  // Auto-carry recurring goals into the viewed week.
  // Looks across ALL prior weeks (not just last week) so jumping forward multiple
  // weeks still works. Respects cadence: weekly = every week, monthly = once per
  // calendar month, quarterly = once per quarter, yearly = once per year.
  useEffect(() => {
    if (goalsLoading) return;
    if (carriedWeekRef.current === weekKey) return;
    carriedWeekRef.current = weekKey;

    (async () => {
      try {
        const token = await getValidAccessToken();
        const allGoals = await getWeeklyGoals(token);

        // Only consider recurring goals from weeks strictly before this one
        const priorRecurring = allGoals.filter(
          (g) => g.recurring && g.weekStartDate < weekKey
        );

        // For each unique roleId+goalText, keep the most recent prior instance
        // (so we use the latest recurringRemaining countdown etc.)
        const latestByKey = new Map<string, typeof priorRecurring[0]>();
        for (const g of priorRecurring) {
          const key = `${g.roleId}|${g.goalText}`;
          const existing = latestByKey.get(key);
          if (!existing || g.weekStartDate > existing.weekStartDate) {
            latestByKey.set(key, g);
          }
        }

        const toCarry = [...latestByKey.values()].filter((g) => {
          if (g.recurringEnds && weekKey > g.recurringEnds) return false;
          if (g.recurringRemaining === 0) return false;
          // Cadence check: should this goal appear in the viewed week?
          const cadence = g.recurringCadence ?? "weekly";
          const [sy, sm, sd] = g.weekStartDate.split("-").map(Number);
          const [ty, tm, td] = weekKey.split("-").map(Number);
          if (cadence === "yearly") {
            if (ty <= sy) return false;
          } else if (cadence === "quarterly") {
            const srcQ = Math.ceil(sm / 3);
            const tgtQ = Math.ceil(tm / 3);
            if (ty < sy) return false;
            if (ty === sy && tgtQ <= srcQ) return false;
          } else if (cadence === "monthly") {
            if (ty < sy) return false;
            if (ty === sy && tm <= sm) return false;
          }
          // weekly (or no cadence): always carry
          return true;
        });

        // Deduplicate against goals already in this week
        const existingKeys = new Set(goals.map((g) => `${g.roleId}|${g.goalText}`));
        const newGoals = toCarry.filter((g) => !existingKeys.has(`${g.roleId}|${g.goalText}`));
        if (newGoals.length === 0) return;

        const now = new Date().toISOString();
        for (const src of newGoals) {
          const copy: WeeklyGoal = {
            ...src,
            id: generateId(),
            weekStartDate: weekKey,
            status: "not_started",
            calendarEventId: undefined,
            calendarSource: undefined,
            createdAt: now,
            updatedAt: now,
            recurringRemaining:
              src.recurringRemaining != null && src.recurringRemaining > 0
                ? src.recurringRemaining - 1
                : src.recurringRemaining,
          };
          await apiAddGoal(token, copy);
        }
        await refreshGoals();
        setRecurringCarryCount(newGoals.length);
      } catch {
        // Silent fail
      }
    })();
  }, [goalsLoading, weekKey]);

  // Schedule notifications when goals or notification settings change
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (goalsLoading) return;
    if (notificationsEnabled) {
      scheduleDailyGoalReminder(goals, notificationTime).catch(() => {});
    }
    if (closeoutReminderEnabled) {
      scheduleCloseoutReminder(closeoutReminderDay, closeoutReminderTime).catch(() => {});
    }
  }, [goals, notificationsEnabled, notificationTime, closeoutReminderEnabled, closeoutReminderDay, closeoutReminderTime, goalsLoading]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    recurringToast: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.primaryLight,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    recurringToastText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
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
    closeoutButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    closeoutButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    lockedBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lockedBannerText: {
      flex: 1,
      fontSize: 12,
      color: colors.textSecondary,
    },
    undoButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    undoButtonText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
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

      {isLocked ? (
        <View style={styles.lockedBanner}>
          <Ionicons name="lock-closed" size={13} color={colors.textSecondary} />
          <Text style={styles.lockedBannerText}>This week has been closed out</Text>
          <Pressable
            onPress={handleUndoCloseout}
            style={({ pressed }) => [styles.undoButton, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.undoButtonText}>Undo</Text>
          </Pressable>
        </View>
      ) : showCloseoutButton && (
        <Pressable
          onPress={() => setShowCloseout(true)}
          style={({ pressed }) => [styles.closeoutButton, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="checkmark-done-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.closeoutButtonText}>Close out last week</Text>
        </Pressable>
      )}

      {recurringCarryCount > 0 && (
        <View style={styles.recurringToast}>
          <Ionicons name="refresh-outline" size={14} color={colors.primary} />
          <Text style={styles.recurringToastText}>
            {recurringCarryCount} recurring goal{recurringCarryCount > 1 ? "s" : ""} added from last week
          </Text>
        </View>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator>
        <GoalsByRole
          goals={goals}
          roles={roles}
          onGoalPress={handleGoalPress}
          onCycleStatus={cycleStatus}
          onCalendarPress={handleCalendarPress}
          onMoveOrCopy={handleMoveOrCopy}
          onDeleteGoal={handleDeleteGoal}
          isLocked={isLocked}
          isLoading={isLoading}
        />
      </ScrollView>

      {!isLocked && !reflectionLoading && (
        <Pressable
          onPress={handleAddGoal}
          style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="add" size={28} color={colors.onPrimary} />
        </Pressable>
      )}

      <WeekPickerModal
        visible={!!moveOrCopyGoal}
        currentWeekStart={weekStart}
        onMove={isLocked ? undefined : handleMove}
        onCopy={handleCopy}
        onClose={() => setMoveOrCopyGoal(null)}
      />

      {showCloseout && (
        <CloseoutModal
          visible
          prevWeekStart={prevWeekStart}
          currentWeekStart={getWeekStart(new Date())}
          onClose={() => { setShowCloseout(false); refreshGoals(); }}
          onComplete={() => { setShowCloseout(false); refreshGoals(); refreshPrevReflection(); }}
        />
      )}
    </View>
  );
}
