import { useContext } from "react";
import {
  CalendarEventsContext,
  CalendarEventsState,
} from "../contexts/CalendarEventsContext";

export function useCalendarEvents(): CalendarEventsState {
  const context = useContext(CalendarEventsContext);
  if (!context) {
    throw new Error(
      "useCalendarEvents must be used within a CalendarEventsProvider"
    );
  }
  return context;
}
