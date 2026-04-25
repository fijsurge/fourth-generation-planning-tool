// FourthGen Planner design system — Blueprint theme
// Brand: deep indigo backgrounds, electric cyan accent, Q2 as visual hero.

export type ThemeMode = "light" | "dark";

export interface ColorPalette {
  primary: string;
  primaryLight: string;

  background: string;
  surface: string;
  border: string;

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

  shadow: string;

  scrollbarThumb: string;
  scrollbarThumbHover: string;

  quadrant: {
    q1: string; // Urgent + Important
    q2: string; // Not Urgent + Important (brand hero — cyan)
    q3: string; // Urgent + Not Important
    q4: string; // Not Urgent + Not Important
  };

  status: {
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

  background: "#F0F2FC",
  surface:    "#FFFFFF",
  border:     "rgba(8,12,34,0.10)",

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

  shadow: "rgba(8,12,34,0.12)",

  scrollbarThumb:      "rgba(8,12,34,0.25)",
  scrollbarThumbHover: "rgba(8,12,34,0.45)",

  quadrant: {
    q1: "#C83232",
    q2: "#0099AA",
    q3: "#4A7AE0",
    q4: "rgba(60,100,220,0.45)",
  },

  status: {
    not_started: "rgba(8,12,34,0.30)",
    in_progress: "#E5A000",
    complete:    "#00B89A",
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

  background: "#06091A",
  surface:    "#0E1435",
  border:     "rgba(232,236,248,0.10)",

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

  shadow: "rgba(0,0,0,0.40)",

  scrollbarThumb:      "rgba(232,236,248,0.25)",
  scrollbarThumbHover: "rgba(232,236,248,0.45)",

  quadrant: {
    q1: "#FF6B6B",
    q2: "#00E6C8",
    q3: "#6A9AFF",
    q4: "rgba(100,140,255,0.50)",
  },

  status: {
    not_started: "rgba(232,236,248,0.30)",
    in_progress: "#F5C842",
    complete:    "#00E6C8",
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
