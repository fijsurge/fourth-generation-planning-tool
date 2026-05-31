import { Quadrant } from "../../models/WeeklyGoal";

export const SAMPLE_MISSION =
  "To live with intention, nurture meaningful relationships, and grow into the person I aspire to be.";

export interface SampleRole {
  name: string;
  description: string;
}

export const SAMPLE_ROLES: SampleRole[] = [
  { name: "Self", description: "Personal growth, health, and reflection" },
  { name: "Spouse", description: "My partner and our relationship" },
  { name: "Friend", description: "Friendships and community" },
  { name: "Professional", description: "Work, career, contribution" },
  { name: "Home Manager", description: "Our home, finances, daily life" },
];

export interface SampleGoal {
  goalText: string;
  quadrant: Quadrant;
}

// Keyed by role name — used in Step 5 to show a relevant example next
// to her chosen roles. All samples are Q2 — that's the framework's point.
export const SAMPLE_GOALS: Record<string, SampleGoal> = {
  Self:            { goalText: "Read 30 minutes before bed Mon-Fri", quadrant: 2 },
  Spouse:          { goalText: "Plan one phone-free dinner together", quadrant: 2 },
  Friend:          { goalText: "Reach out to a friend I haven't talked to recently", quadrant: 2 },
  Professional:    { goalText: "Block 2 hours of deep work on the strategy doc", quadrant: 2 },
  "Home Manager":  { goalText: "Plan next week's meals and groceries", quadrant: 2 },
};

export const GENERIC_SAMPLE_GOAL: SampleGoal = {
  goalText: "Take 30 minutes for something important you've been putting off",
  quadrant: 2,
};
