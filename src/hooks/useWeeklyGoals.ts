import { useState, useEffect, useCallback } from "react";
import { WeeklyGoal, Quadrant, GoalStatus } from "../models/WeeklyGoal";
import { useAuth } from "../auth/AuthContext";
import {
  getWeeklyGoalsByWeek,
  addWeeklyGoal as apiAddGoal,
  updateWeeklyGoal as apiUpdateGoal,
  deleteWeeklyGoal as apiDeleteGoal,
} from "../api/googleSheets";
import { generateId } from "../utils/uuid";
import { STATUS_CYCLE } from "../utils/constants";

export function useWeeklyGoals(weekStartDate: string) {
  const { getValidAccessToken } = useAuth();
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

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const addGoal = useCallback(
    async (params: {
      roleId: string;
      goalText: string;
      quadrant: Quadrant;
      notes?: string;
      recurring?: boolean;
      recurringEnds?: string;
      recurringRemaining?: number;
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
        recurringEnds: params.recurringEnds,
        recurringRemaining: params.recurringRemaining,
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
      } catch (err: any) {
        await loadGoals();
        setError(err.message);
        throw err;
      }
    },
    [getValidAccessToken, loadGoals]
  );

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
    const copy: WeeklyGoal = { ...goal, id: generateId(), weekStartDate: targetWeekDate, createdAt: now, updatedAt: now };
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
