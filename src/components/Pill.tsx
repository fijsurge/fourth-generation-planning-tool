// FourthGen Planner — Pill primitive.
// Shared base for StatusBadge, QuadrantBadge, and any future capsule label.
// Centralizes padding, radius, font sizing, and pressed-state opacity so
// individual badges stay tiny and stop drifting visually.

import { ReactNode } from "react";
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { spacing, borderRadius } from "../theme/spacing";
import { typography } from "../theme/typography";

interface PillProps {
  /** Foreground color — text + border. */
  color: string;
  /** Background color — typically the palette's *Soft* variant of `color`. */
  backgroundColor: string;
  /** Optional outlined style. Set false for filled-only pills. */
  bordered?: boolean;
  onPress?: () => void;
  children: ReactNode;
  /** Compact pill — narrower padding, used in dense lists. */
  compact?: boolean;
}

export function Pill({
  color,
  backgroundColor,
  bordered = true,
  onPress,
  children,
  compact = false,
}: PillProps) {
  const containerStyle: ViewStyle = {
    backgroundColor,
    borderColor: bordered ? color : "transparent",
    borderWidth: bordered ? 1 : 0,
    paddingHorizontal: compact ? spacing.xs + 2 : spacing.sm,
    paddingVertical: compact ? 2 : spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  };

  const labelStyle: TextStyle = {
    ...typography.caption,
    color,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
      >
        <Text style={labelStyle}>{children}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable disabled style={containerStyle}>
      <Text style={labelStyle}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.65 },
});
