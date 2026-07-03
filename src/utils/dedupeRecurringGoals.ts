import { WeeklyGoal } from "../models/WeeklyGoal";

// Groups a week into the recurrence period it belongs to for a given cadence,
// mirroring the carry logic in app/(tabs)/weekly-plan.tsx.
function periodKey(weekStartDate: string, cadence: "weekly" | "monthly" | "quarterly" | "yearly"): string {
  const [y, m] = weekStartDate.split("-").map(Number);
  if (cadence === "weekly") return weekStartDate;
  if (cadence === "yearly") return String(y);
  if (cadence === "quarterly") return `${y}-Q${Math.ceil(m / 3)}`;
  return `${y}-${m}`; // monthly
}

// Ranks goals within a duplicate group so the most "lived-in" copy is kept:
// linked to a calendar event, further along in status, has notes.
function score(g: WeeklyGoal): number {
  let s = 0;
  if (g.calendarEventId) s += 100;
  if (g.status === "complete") s += 20;
  else if (g.status === "in_progress") s += 10;
  if (g.notes && g.notes.trim()) s += 5;
  return s;
}

export interface DuplicateGroup {
  key: string;
  keep: WeeklyGoal;
  remove: WeeklyGoal[];
}

// Finds recurring-goal rows that are duplicates of each other for the same
// recurrence period (same week for weekly cadence; same month/quarter/year
// for monthly/quarterly/yearly), caused by the auto-carry bug that re-copied
// monthly/quarterly/yearly goals into every week of their period instead of
// once per period.
export function findDuplicateRecurringGoals(goals: WeeklyGoal[]): DuplicateGroup[] {
  const groups = new Map<string, WeeklyGoal[]>();
  for (const g of goals) {
    if (!g.recurring) continue;
    const cadence = g.recurringCadence ?? "weekly";
    const groupKey = `${g.roleId}|${g.goalText}|${periodKey(g.weekStartDate, cadence)}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push(g);
  }

  const duplicates: DuplicateGroup[] = [];
  for (const [key, group] of groups) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => {
      const scoreDiff = score(b) - score(a);
      if (scoreDiff !== 0) return scoreDiff;
      if (a.weekStartDate !== b.weekStartDate) return a.weekStartDate < b.weekStartDate ? -1 : 1;
      return a.createdAt < b.createdAt ? -1 : 1;
    });
    const [keep, ...remove] = sorted;
    duplicates.push({ key, keep, remove });
  }
  return duplicates;
}
