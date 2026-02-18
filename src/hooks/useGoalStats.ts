import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { getWeeklyGoals, getReflections } from "../api/googleSheets";
import { WeeklyReflection } from "../models/WeeklyReflection";

export interface QuadrantStats {
  quadrant: 1 | 2 | 3 | 4;
  complete: number;
  total: number;
  pct: number;
}

export interface WeekStats {
  weekStartDate: string;
  complete: number;
  total: number;
  pct: number;
  byQuadrant: QuadrantStats[];
  reflection?: WeeklyReflection;
}

export interface GoalStatsResult {
  isLoading: boolean;
  error: string | null;
  weekHistory: WeekStats[];
  overallPct: number;
  overallComplete: number;
  overallTotal: number;
  refresh: () => void;
}

export function useGoalStats(): GoalStatsResult {
  const { getValidAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekHistory, setWeekHistory] = useState<WeekStats[]>([]);
  const [overallComplete, setOverallComplete] = useState(0);
  const [overallTotal, setOverallTotal] = useState(0);
  const [overallPct, setOverallPct] = useState(0);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getValidAccessToken();
      const [allGoals, allReflections] = await Promise.all([
        getWeeklyGoals(token),
        getReflections(token).catch(() => [] as WeeklyReflection[]),
      ]);
      const reflectionByWeek = new Map(allReflections.map((r) => [r.weekStartDate, r]));

      // Group goals by weekStartDate
      const weekMap = new Map<string, typeof allGoals>();
      for (const goal of allGoals) {
        const list = weekMap.get(goal.weekStartDate) || [];
        list.push(goal);
        weekMap.set(goal.weekStartDate, list);
      }

      const history: WeekStats[] = [];
      for (const [weekStartDate, goals] of weekMap.entries()) {
        if (goals.length === 0) continue;
        const complete = goals.filter((g) => g.status === "complete").length;
        const total = goals.length;
        const pct = Math.round((complete / total) * 100);

        const byQuadrant: QuadrantStats[] = ([1, 2, 3, 4] as (1 | 2 | 3 | 4)[]).map((q) => {
          const qGoals = goals.filter((g) => g.quadrant === q);
          const qComplete = qGoals.filter((g) => g.status === "complete").length;
          const qTotal = qGoals.length;
          return {
            quadrant: q,
            complete: qComplete,
            total: qTotal,
            pct: qTotal > 0 ? Math.round((qComplete / qTotal) * 100) : 0,
          };
        });

        history.push({
          weekStartDate,
          complete,
          total,
          pct,
          byQuadrant,
          reflection: reflectionByWeek.get(weekStartDate),
        });
      }

      // Sort ascending by date (YYYY-MM-DD string sort works correctly)
      history.sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

      // Compute overall stats
      const oTotal = allGoals.length;
      const oComplete = allGoals.filter((g) => g.status === "complete").length;
      const oPct = oTotal > 0 ? Math.round((oComplete / oTotal) * 100) : 0;

      setWeekHistory(history);
      setOverallComplete(oComplete);
      setOverallTotal(oTotal);
      setOverallPct(oPct);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getValidAccessToken]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    isLoading,
    error,
    weekHistory,
    overallPct,
    overallComplete,
    overallTotal,
    refresh: load,
  };
}
