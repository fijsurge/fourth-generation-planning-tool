import { useState, useEffect, useCallback, useRef } from "react";
import { Platform } from "react-native";
import { WeeklyGoal, Quadrant, GoalStatus, RecurringCadence } from "../models/WeeklyGoal";
import { useAuth } from "../auth/AuthContext";
import { useRoles } from "./useRoles";
import { pushGoalsToWatch } from "../notifications/wearSync";
import { requireOptionalNativeModule } from "expo-modules-core";
import {
  getWeeklyGoalsByWeek,
  addWeeklyGoal as apiAddGoal,
  updateWeeklyGoal as apiUpdateGoal,
  deleteWeeklyGoal as apiDeleteGoal,
} from "../api/googleSheets";
import { generateId } from "../utils/uuid";
import { STATUS_CYCLE } from "../utils/constants";
import { cancelGoalFollowup } from "../notifications/goalNotifications";

export function useWeeklyGoals(weekStartDate: string) {
  const { getValidAccessToken } = useAuth();
  const { roles } = useRoles();
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getValidAccessToken();
      const data = await getWeeklyGoalsByWeek(token, weekStartDate);
      setGoals(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getValidAccessToken, weekStartDate]);

  // Push to watch whenever goals or roles change (roles load async, so this
  // ensures we always send with the correct role names even on first load).
  useEffect(() => {
    if (Platform.OS !== "android" || goals.length === 0 || roles.length === 0) return;
    pushGoalsToWatch(goals, roles).catch(() => {});
  }, [goals, roles]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Stable refs so the watch event listener doesn't capture stale closures
  const goalsRef = useRef(goals);
  useEffect(() => { goalsRef.current = goals; }, [goals]);
  const updateGoalRef = useRef<((goal: WeeklyGoal) => Promise<void>) | null>(null);

  // Subscribe to status updates pushed from the Pixel Watch
  useEffect(() => {
    if (Platform.OS !== "android") return;
    let WearDataModule: any = null;
    try {
      WearDataModule = requireOptionalNativeModule("WearDataModule");
    } catch {
      return;
    }
    if (!WearDataModule?.addListener) return;

    const subscription = WearDataModule.addListener(
      "onGoalStatusUpdate",
      ({ goalId, status }: { goalId: string; status: string }) => {
        const goal = goalsRef.current.find((g) => g.id === goalId);
        if (!goal || !updateGoalRef.current) return;
        updateGoalRef.current({ ...goal, status: status as GoalStatus }).catch(() => {});
      }
    );

    return () => subscription.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addGoal = useCallback(
    async (params: {
      roleId: string;
      goalText: string;
      quadrant: Quadrant;
      notes?: string;
      recurring?: boolean;
      recurringCadence?: RecurringCadence;
      recurringEnds?: string;
      recurringRemaining?: number;
      isBigRock?: boolean;
      priority?: number;
    }) => {
      const now = new Date().toISOString();
      const newGoal: WeeklyGoal = {
        id: generateId(),
        weekStartDate,
        roleId: params.roleId,
        goalText: params.goalText,
        quadrant: params.quadrant,
        status: "not_started",
        notes: params.notes || "",
        createdAt: now,
        updatedAt: now,
        recurring: params.recurring,
        recurringCadence: params.recurringCadence,
        recurringEnds: params.recurringEnds,
        recurringRemaining: params.recurringRemaining,
        isBigRock: params.isBigRock,
        priority: params.priority,
      };

      // Optimistic update
      setGoals((prev) => [...prev, newGoal]);

      try {
        const token = await getValidAccessToken();
        await apiAddGoal(token, newGoal);
      } catch (err: any) {
        setGoals((prev) => prev.filter((g) => g.id !== newGoal.id));
        setError(err.message);
        throw err;
      }

      return newGoal;
    },
    [weekStartDate, getValidAccessToken]
  );

  const updateGoal = useCallback(
    async (goal: WeeklyGoal) => {
      const updated = { ...goal, updatedAt: new Date().toISOString() };

      setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)));

      try {
        const token = await getValidAccessToken();
        await apiUpdateGoal(token, updated);
        // A completed or unlinked goal should no longer prompt a follow-up.
        if (updated.status === "complete" || !updated.calendarEventId) {
          await cancelGoalFollowup(updated.id).catch(() => {});
        }
      } catch (err: any) {
        await loadGoals();
        setError(err.message);
        throw err;
      }
    },
    [getValidAccessToken, loadGoals]
  );

  // Keep updateGoalRef current so the watch event listener can call it
  useEffect(() => { updateGoalRef.current = updateGoal; }, [updateGoal]);

  const cycleStatus = useCallback(
    async (goalId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;

      const currentIndex = STATUS_CYCLE.indexOf(goal.status);
      const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
      await updateGoal({ ...goal, status: nextStatus });
    },
    [goals, updateGoal]
  );

  const deleteGoalById = useCallback(
    async (goalId: string) => {
      const previous = goals;
      setGoals((prev) => prev.filter((g) => g.id !== goalId));

      try {
        const token = await getValidAccessToken();
        await apiDeleteGoal(token, goalId);
        await cancelGoalFollowup(goalId).catch(() => {});
      } catch (err: any) {
        setGoals(previous);
        setError(err.message);
        throw err;
      }
    },
    [goals, getValidAccessToken]
  );

  const moveGoalToWeek = useCallback(async (goalId: string, targetWeekDate: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const previous = goals;
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    try {
      const token = await getValidAccessToken();
      await apiUpdateGoal(token, { ...goal, weekStartDate: targetWeekDate, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      setGoals(previous);
      setError(err.message);
      throw err;
    }
  }, [goals, getValidAccessToken]);

  const copyGoalToWeek = useCallback(async (goalId: string, targetWeekDate: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const now = new Date().toISOString();
    // A copy is a fresh goal in a new week: don't carry the source goal's
    // calendar-event link (it belongs to the original) or its completion status.
    const copy: WeeklyGoal = {
      ...goal,
      id: generateId(),
      weekStartDate: targetWeekDate,
      status: "not_started",
      calendarEventId: undefined,
      calendarSource: undefined,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const token = await getValidAccessToken();
      await apiAddGoal(token, copy);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [goals, getValidAccessToken]);

  return {
    goals,
    isLoading,
    error,
    addGoal,
    updateGoal,
    cycleStatus,
    deleteGoal: deleteGoalById,
    moveGoalToWeek,
    copyGoalToWeek,
    refresh: loadGoals,
  };
}
