// FourthGen Planner — elevation tokens.
// React Native uses iOS shadow* props + Android `elevation`. Web (react-native-web)
// translates shadow* to box-shadow, so this works cross-platform.
//
// Compose with `colors.shadow` at the call site for theme-aware shadow color:
//   { ...elevation.md, shadowColor: colors.shadow }

import { ViewStyle } from "react-native";

const make = (
  offsetY: number,
  radius: number,
  opacity: number,
  androidElevation: number
): ViewStyle => ({
  shadowOffset: { width: 0, height: offsetY },
  shadowRadius: radius,
  shadowOpacity: opacity,
  elevation: androidElevation,
});

export const elevation = {
  // Hairline — subtle separation, list rows on a colored bg
  xs: make(1, 2, 0.04, 1),
  // Cards at rest
  sm: make(1, 4, 0.06, 2),
  // Raised cards, sticky headers
  md: make(2, 8, 0.10, 4),
  // Floating: FAB, modals, popovers
  lg: make(6, 16, 0.16, 8),
  // Highest: dialogs, full-screen sheets
  xl: make(12, 28, 0.22, 12),
};

export type ElevationToken = keyof typeof elevation;
