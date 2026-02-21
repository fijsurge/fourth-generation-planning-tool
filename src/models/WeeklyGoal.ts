export type Quadrant = 1 | 2 | 3 | 4;

export type GoalStatus = "not_started" | "in_progress" | "complete";

export type CalendarSource = "google" | "outlook";

export interface WeeklyGoal {
  id: string;
  weekStartDate: string; // ISO date string (Monday)
  roleId: string;
  goalText: string;
  quadrant: Quadrant;
  status: GoalStatus;
  notes: string;
  calendarEventId?: string;
  calendarSource?: CalendarSource;
  createdAt: string;
  updatedAt: string;
  recurring?: boolean;
  recurringEnds?: string;        // YYYY-MM-DD — stop carrying after this date
  recurringRemaining?: number;   // countdown; 0 = do not carry anymore
}
