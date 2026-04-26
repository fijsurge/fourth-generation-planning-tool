// FourthGen Planner — typography scale.
// Pair this with `useThemeColors()` for color: components should compose
// `{ ...typography.body, color: colors.text }` instead of hard-coding sizes.
//
// Scale rationale:
//   display 28 — splash / hero (settings header, login)
//   h1      22 — screen titles (Weekly Plan, Stats)
//   h2      18 — section headers within a screen
//   bodyLg  16 — primary content (role names, settings rows)
//   body    15 — default body text (goal text)
//   bodySm  13 — supporting / dense lists (quadrant cell goals)
//   caption 12 — badges, count chips, footnotes
//   micro   11 — tertiary metadata (role name beneath a goal in big-rock list)

import { Platform, TextStyle } from "react-native";

export const fontWeight = {
  regular:  "400" as const,
  medium:   "500" as const,
  semibold: "600" as const,
  bold:     "700" as const,
};

// Native fonts: rely on system defaults (San Francisco / Roboto) for now.
// Future: swap to a brand face here without touching components.
export const fontFamily = {
  // System sans — set explicitly so web matches native
  sans: Platform.select({
    ios:     "System",
    android: "Roboto",
    default: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  }),
  // Reserved — slot for a serif display face if we ever pivot editorial
  serif: Platform.select({
    ios:     "Georgia",
    android: "serif",
    default: "Georgia, 'Times New Roman', serif",
  }),
  // For numeric counts, weekly date labels — tabular figures align in stacks
  mono: Platform.select({
    ios:     "Menlo",
    android: "monospace",
    default: "ui-monospace, SFMono-Regular, Menlo, monospace",
  }),
};

// Each role is a TextStyle fragment — compose with `color` at the call site.
export const typography = {
  display: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.4,
  } satisfies TextStyle,

  h1: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.3,
  } satisfies TextStyle,

  h2: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.2,
  } satisfies TextStyle,

  bodyLg: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeight.semibold,
  } satisfies TextStyle,

  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: fontWeight.regular,
  } satisfies TextStyle,

  bodySm: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeight.regular,
  } satisfies TextStyle,

  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  } satisfies TextStyle,

  micro: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: fontWeight.regular,
    letterSpacing: 0.1,
  } satisfies TextStyle,
};

export type TypographyToken = keyof typeof typography;
