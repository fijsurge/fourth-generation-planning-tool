import React, { createContext, useState, useCallback } from "react";
import { CalendarEvent } from "../models/CalendarEvent";
import { useAuth } from "../auth/AuthContext";
import {
  listEvents as apiListEvents,
  createEvent as apiCreateEvent,
  updateEvent as apiUpdateEvent,
  deleteEvent as apiDeleteEvent,
} from "../api/googleCalendar";

export interface CalendarEventsState {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  loadEvents: (timeMin: string, timeMax: string) => Promise<void>;
  createEvent: (
    event: Omit<CalendarEvent, "id" | "source">
  ) => Promise<CalendarEvent>;
  updateEvent: (
    eventId: string,
    event: Partial<CalendarEvent>
  ) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

export const CalendarEventsContext =
  createContext<CalendarEventsState | null>(null);

export function CalendarEventsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getValidAccessToken, isLoggedIn } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(
    async (timeMin: string, timeMax: string) => {
      if (!isLoggedIn) return;
      try {
        setIsLoading(true);
        setError(null);
        const token = await getValidAccessToken();
        const data = await apiListEvents(token, timeMin, timeMax);
        setEvents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [getValidAccessToken, isLoggedIn]
  );

  const createEvent = useCallback(
    async (
      event: Omit<CalendarEvent, "id" | "source">
    ): Promise<CalendarEvent> => {
      const token = await getValidAccessToken();
      const created = await apiCreateEvent(token, event);

      setEvents((prev) => [...prev, created]);
      return created;
    },
    [getValidAccessToken]
  );

  const updateEvent = useCallback(
    async (eventId: string, event: Partial<CalendarEvent>) => {
      const previous = events;

      // Optimistic update
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, ...event } : e))
      );

      try {
        const token = await getValidAccessToken();
        await apiUpdateEvent(token, eventId, event);
      } catch (err: any) {
        setEvents(previous);
        setError(err.message);
        throw err;
      }
    },
    [events, getValidAccessToken]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      const previous = events;

      // Optimistic removal
      setEvents((prev) => prev.filter((e) => e.id !== eventId));

      try {
        const token = await getValidAccessToken();
        await apiDeleteEvent(token, eventId);
      } catch (err: any) {
        setEvents(previous);
        setError(err.message);
        throw err;
      }
    },
    [events, getValidAccessToken]
  );

  return (
    <CalendarEventsContext.Provider
      value={{
        events,
        isLoading,
        error,
        loadEvents,
        createEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </CalendarEventsContext.Provider>
  );
}
