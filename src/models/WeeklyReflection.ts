export interface WeeklyReflection {
  id: string;
  weekStartDate: string; // "YYYY-MM-DD" Monday of the closed-out week
  wentWell: string;
  didntGoWell: string;
  intentions: string; // "Intentions for next week"
  createdAt: string;
  updatedAt: string;
  weekRating?: number | null;
}
