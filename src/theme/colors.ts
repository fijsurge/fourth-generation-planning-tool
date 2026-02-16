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
    q1: string; // Urgent + Important (red)
    q2: string; // Not Urgent + Important (blue)
    q3: string; // Urgent + Not Important (orange)
    q4: string; // Not Urgent + Not Important (gray)
  };

  status: {
    not_started: string; // gray
    in_progress: string; // amber
    complete: string; // green
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
  primary: "#2563eb",
  primaryLight: "#dbeafe",

  background: "#ffffff",
  surface: "#f8fafc",
  border: "#e2e8f0",

  text: "#1e293b",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",

  onPrimary: "#ffffff",

  danger: "#dc2626",
  dangerLight: "#fef2f2",

  warningBg: "#fef3c7",
  warningText: "#92400e",

  successBg: "#dcfce7",
  successText: "#16a34a",

  shadow: "#000000",

  scrollbarThumb: "rgba(0,0,0,0.3)",
  scrollbarThumbHover: "rgba(0,0,0,0.5)",

  quadrant: {
    q1: "#dc2626",
    q2: "#2563eb",
    q3: "#f59e0b",
    q4: "#6b7280",
  },

  status: {
    not_started: "#94a3b8",
    in_progress: "#f59e0b",
    complete: "#16a34a",
  },

  calendarSource: {
    google: "#2563eb",
    outlook: "#7c3aed",
  },

  attendeeStatus: {
    accepted: "#16a34a",
    declined: "#dc2626",
    tentative: "#d97706",
    needsAction: "#9ca3af",
  },
};

export const darkColors: ColorPalette = {
  primary: "#3b82f6",
  primaryLight: "#1e3a5f",

  background: "#0f172a",
  surface: "#1e293b",
  border: "#334155",

  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",

  onPrimary: "#ffffff",

  danger: "#ef4444",
  dangerLight: "#450a0a",

  warningBg: "#451a03",
  warningText: "#fbbf24",

  successBg: "#052e16",
  successText: "#4ade80",

  shadow: "#000000",

  scrollbarThumb: "rgba(255,255,255,0.3)",
  scrollbarThumbHover: "rgba(255,255,255,0.5)",

  quadrant: {
    q1: "#ef4444",
    q2: "#3b82f6",
    q3: "#fbbf24",
    q4: "#9ca3af",
  },

  status: {
    not_started: "#64748b",
    in_progress: "#fbbf24",
    complete: "#4ade80",
  },

  calendarSource: {
    google: "#3b82f6",
    outlook: "#a78bfa",
  },

  attendeeStatus: {
    accepted: "#4ade80",
    declined: "#ef4444",
    tentative: "#fbbf24",
    needsAction: "#6b7280",
  },
};
