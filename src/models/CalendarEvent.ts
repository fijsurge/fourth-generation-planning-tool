import { CalendarSource } from "./WeeklyGoal";

export interface CalendarEvent {
  id: string;
  source: CalendarSource;
  title: string;
  description: string;
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  allDay: boolean;
  linkedGoalId?: string;
}
