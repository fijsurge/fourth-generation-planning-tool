import { CalendarSource } from "./WeeklyGoal";

export interface EventAttendee {
  email: string;
  responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
}

export type EventTransparency = "opaque" | "transparent";

export interface CalendarEvent {
  id: string;
  source: CalendarSource;
  title: string;
  description: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  allDay: boolean;
  linkedGoalId?: string;
  attendees?: EventAttendee[];
  transparency?: EventTransparency;
  colorId?: string;
}
