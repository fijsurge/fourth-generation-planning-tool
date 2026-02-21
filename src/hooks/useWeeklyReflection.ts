import { useState, useEffect, useCallback } from "react";
import { WeeklyReflection } from "../models/WeeklyReflection";
import { useAuth } from "../auth/AuthContext";
import {
  getReflectionByWeek,
  addReflection,
  updateReflection,
  deleteReflection as apiDeleteReflection,
} from "../api/googleSheets";
import { generateId } from "../utils/uuid";

export function useWeeklyReflection(weekStartDate: string) {
  const { getValidAccessToken } = useAuth();
  const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getValidAccessToken();
      const data = await getReflectionByWeek(token, weekStartDate);
      setReflection(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getValidAccessToken, weekStartDate]);

  useEffect(() => {
    load();
  }, [load]);

  const saveReflection = useCallback(
    async (params: {
      wentWell: string;
      didntGoWell: string;
      intentions: string;
      weekRating?: number | null;
    }) => {
      try {
        setError(null);
        const token = await getValidAccessToken();
        const now = new Date().toISOString();
        if (reflection === null) {
          const newReflection: WeeklyReflection = {
            id: generateId(),
            weekStartDate,
            wentWell: params.wentWell,
            didntGoWell: params.didntGoWell,
            intentions: params.intentions,
            weekRating: params.weekRating,
            createdAt: now,
            updatedAt: now,
          };
          await addReflection(token, newReflection);
          setReflection(newReflection);
        } else {
          const updated: WeeklyReflection = {
            ...reflection,
            wentWell: params.wentWell,
            didntGoWell: params.didntGoWell,
            intentions: params.intentions,
            weekRating: params.weekRating,
            updatedAt: now,
          };
          await updateReflection(token, updated);
          setReflection(updated);
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [reflection, weekStartDate, getValidAccessToken]
  );

  const deleteReflection = useCallback(async () => {
    if (!reflection) return;
    try {
      setError(null);
      const token = await getValidAccessToken();
      await apiDeleteReflection(token, reflection.id);
      setReflection(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [reflection, getValidAccessToken]);

  return { reflection, isLoading, error, saveReflection, deleteReflection, refresh: load };
}
