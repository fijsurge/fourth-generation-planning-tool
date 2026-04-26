// FourthGen Planner design system — Blueprint theme
// Brand: deep indigo backgrounds, electric cyan accent, Q2 as visual hero.
//
// Token additions (Apr 2026):
//   - quadrantSoft / quadrantSofter — pre-computed alpha variants so components
//     stop concatenating "+ '20'" everywhere
//   - statusSoft — same idea for status colors
//   - bigRock + bigRockSoft — Big Rocks (priority Q2) accent moved out of GoalItem
//   - quadrant.q4 — now a true muted slate (was a faded Q3 blue, which read muddy)

export type ThemeMode = "light" | "dark";

export interface ColorPalette {
  primary: string;
  primaryLight: string;

  background: string;
  surface: string;
  surfaceElevated: string; // raised cards / sheets / modals
  border: string;
  borderStrong: string;     // for emphasized dividers

  text: string;
  textSecondary: string;
  textMuted: string;

  // Used on primary-colored buttons, FABs, active segments
  onPrimary: string;

  danger: string;
  dangerLight: string;

  warningBg: string;
  warningText: string;

  successBg: string;
  successText: string;

  // Big Rocks accent (priority Q2 goals)
  bigRock: string;
  bigRockSoft: string;

  shadow: string;

  scrollbarThumb: string;
  scrollbarThumbHover: string;

  quadrant: {
    q1: string; // Urgent + Important
    q2: string; // Not Urgent + Important (brand hero — cyan)
    q3: string; // Urgent + Not Important
    q4: string; // Not Urgent + Not Important (true neutral, not faded Q3)
  };

  // ~12% alpha — for badge backgrounds, count chips
  quadrantSoft: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  };

  // ~6% alpha — for cell backgrounds, hover fills
  quadrantSofter: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
  };

  status: {
    not_started: string;
    in_progress: string;
    complete: string;
  };

  // ~12% alpha — for badge backgrounds
  statusSoft: {
    not_started: string;
    in_progress: string;
    complete: string;
  };

  calendarSource: {
    google: string;
    outlook: string;
  };

  attendeeStatus: {
    accepted: string;
    declined: string;
    tentative: string;
    needsAction: string;
  };
}

export const lightColors: ColorPalette = {
  primary:      "#0099AA",
  primaryLight: "rgba(0,153,170,0.10)",

  background:      "#F0F2FC",
  surface:         "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  border:          "rgba(8,12,34,0.10)",
  borderStrong:    "rgba(8,12,34,0.18)",

  text:          "#080C22",
  textSecondary: "rgba(8,12,34,0.55)",
  textMuted:     "rgba(8,12,34,0.35)",

  onPrimary: "#FFFFFF",

  danger:      "#C83232",
  dangerLight: "rgba(200,50,50,0.10)",

  warningBg:   "rgba(229,160,0,0.12)",
  warningText: "#E5A000",

  successBg:   "rgba(0,184,154,0.12)",
  successText: "#00B89A",

  bigRock:     "#F59E0B",
  bigRockSoft: "rgba(245,158,11,0.14)",

  shadow: "rgba(8,12,34,0.12)",

  scrollbarThumb:      "rgba(8,12,34,0.25)",
  scrollbarThumbHover: "rgba(8,12,34,0.45)",

  quadrant: {
    q1: "#C83232",
    q2: "#0099AA",
    q3: "#4A7AE0",
    q4: "#7B8499", // muted slate — distinct from Q3, reads as "low priority"
  },

  quadrantSoft: {
    q1: "rgba(200,50,50,0.12)",
    q2: "rgba(0,153,170,0.12)",
    q3: "rgba(74,122,224,0.12)",
    q4: "rgba(123,132,153,0.14)",
  },

  quadrantSofter: {
    q1: "rgba(200,50,50,0.06)",
    q2: "rgba(0,153,170,0.06)",
    q3: "rgba(74,122,224,0.06)",
    q4: "rgba(123,132,153,0.07)",
  },

  status: {
    not_started: "rgba(8,12,34,0.30)",
    in_progress: "#E5A000",
    complete:    "#00B89A",
  },

  statusSoft: {
    not_started: "rgba(8,12,34,0.08)",
    in_progress: "rgba(229,160,0,0.12)",
    complete:    "rgba(0,184,154,0.12)",
  },

  calendarSource: {
    google:  "#0099AA",
    outlook: "#4A7AE0",
  },

  attendeeStatus: {
    accepted:    "#00B89A",
    declined:    "#C83232",
    tentative:   "#E5A000",
    needsAction: "rgba(8,12,34,0.35)",
  },
};

export const darkColors: ColorPalette = {
  primary:      "#00E6C8",
  primaryLight: "rgba(0,230,200,0.13)",

  background:      "#06091A",
  surface:         "#0E1435",
  surfaceElevated: "#141B40", // one notch above surface for stacked cards
  border:          "rgba(232,236,248,0.10)",
  borderStrong:    "rgba(232,236,248,0.18)",

  text:          "#E8ECF8",
  textSecondary: "rgba(232,236,248,0.55)",
  textMuted:     "rgba(232,236,248,0.30)",

  // Cyan buttons need dark text to maintain contrast
  onPrimary: "#080C22",

  danger:      "#FF6B6B",
  dangerLight: "rgba(255,107,107,0.10)",

  warningBg:   "rgba(245,200,66,0.12)",
  warningText: "#F5C842",

  successBg:   "rgba(0,230,200,0.10)",
  successText: "#00E6C8",

  bigRock:     "#FFB547", // slightly warmer/brighter for dark mode contrast
  bigRockSoft: "rgba(255,181,71,0.14)",

  shadow: "rgba(0,0,0,0.40)",

  scrollbarThumb:      "rgba(232,236,248,0.25)",
  scrollbarThumbHover: "rgba(232,236,248,0.45)",

  quadrant: {
    q1: "#FF6B6B",
    q2: "#00E6C8",
    q3: "#6A9AFF",
    q4: "#8A93AB", // lighter cool slate for dark mode
  },

  quadrantSoft: {
    q1: "rgba(255,107,107,0.14)",
    q2: "rgba(0,230,200,0.14)",
    q3: "rgba(106,154,255,0.14)",
    q4: "rgba(138,147,171,0.16)",
  },

  quadrantSofter: {
    q1: "rgba(255,107,107,0.07)",
    q2: "rgba(0,230,200,0.07)",
    q3: "rgba(106,154,255,0.07)",
    q4: "rgba(138,147,171,0.08)",
  },

  status: {
    not_started: "rgba(232,236,248,0.30)",
    in_progress: "#F5C842",
    complete:    "#00E6C8",
  },

  statusSoft: {
    not_started: "rgba(232,236,248,0.10)",
    in_progress: "rgba(245,200,66,0.14)",
    complete:    "rgba(0,230,200,0.14)",
  },

  calendarSource: {
    google:  "#00E6C8",
    outlook: "#6A9AFF",
  },

  attendeeStatus: {
    accepted:    "#00E6C8",
    declined:    "#FF6B6B",
    tentative:   "#F5C842",
    needsAction: "rgba(232,236,248,0.30)",
  },
};
