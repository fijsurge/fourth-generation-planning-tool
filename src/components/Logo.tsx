// FourthGen Planner — brand mark.
// Visual: 2×2 quadrant grid with Q2 (top-right) lit cyan and a target/scope
// glyph inside it. Q2 = "Important, Not Urgent" — Covey's framework hero.
//
// Auto-themed via useThemeColors(). Use anywhere a logo is needed:
//   <Logo size={28} />         // tab header
//   <Logo size={120} />        // splash / login screen
//   <Logo size={28} mono />    // single-color (monogram) variant for tight UI
//
// Replaces the previous Image-based approach which required a tintColor hack
// because the "white" PNG didn't have true transparency.

import { View } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, Line } from "react-native-svg";
import { useThemeColors } from "../theme/useThemeColors";

interface LogoProps {
  size?: number;
  /** Single-color rendering — useful in dense headers or monochrome contexts. */
  mono?: boolean;
  /** Override the active (Q2) color — falls back to theme primary. */
  accent?: string;
}

export function Logo({ size = 32, mono = false, accent }: LogoProps) {
  const colors = useThemeColors();
  const q2 = accent ?? colors.quadrant.q2;

  // Tile geometry (designed in a 64×64 viewBox)
  const VB = 64;
  const tile = 24;            // cell size
  const radius = 5;           // tile corner radius
  const gap = 4;              // grid gap (between tiles, around target)
  const offset = (VB - 2 * tile - gap) / 2; // 6
  const stroke = 2;
  const dimStroke = mono ? colors.text : colors.textMuted;
  const dimFill = mono ? "transparent" : colors.quadrantSofter.q2;

  // Top-right (Q2) tile coordinates
  const q2x = offset + tile + gap;
  const q2y = offset;

  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox={`0 0 ${VB} ${VB}`} width={size} height={size}>
        <Defs>
          <LinearGradient id="q2grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={q2} stopOpacity="0.18" />
            <Stop offset="1" stopColor={q2} stopOpacity="0.32" />
          </LinearGradient>
        </Defs>

        {/* Q1 — top-left (dim) */}
        <Rect
          x={offset}
          y={offset}
          width={tile}
          height={tile}
          rx={radius}
          ry={radius}
          fill={mono ? "transparent" : colors.quadrantSofter.q1}
          stroke={dimStroke}
          strokeWidth={stroke * 0.6}
          strokeOpacity={mono ? 0.6 : 0.5}
        />

        {/* Q3 — bottom-left (dim) */}
        <Rect
          x={offset}
          y={offset + tile + gap}
          width={tile}
          height={tile}
          rx={radius}
          ry={radius}
          fill={mono ? "transparent" : colors.quadrantSofter.q3}
          stroke={dimStroke}
          strokeWidth={stroke * 0.6}
          strokeOpacity={mono ? 0.6 : 0.5}
        />

        {/* Q4 — bottom-right (dim) */}
        <Rect
          x={offset + tile + gap}
          y={offset + tile + gap}
          width={tile}
          height={tile}
          rx={radius}
          ry={radius}
          fill={mono ? "transparent" : colors.quadrantSofter.q4}
          stroke={dimStroke}
          strokeWidth={stroke * 0.6}
          strokeOpacity={mono ? 0.6 : 0.5}
        />

        {/* Q2 — top-right (lit, hero) */}
        <Rect
          x={q2x}
          y={q2y}
          width={tile}
          height={tile}
          rx={radius}
          ry={radius}
          fill={mono ? "transparent" : "url(#q2grad)"}
          stroke={mono ? colors.text : q2}
          strokeWidth={stroke}
        />

        {/* Target glyph inside Q2 — concentric circle + crosshair ticks */}
        {/* Outer ring */}
        <Circle
          cx={q2x + tile / 2}
          cy={q2y + tile / 2}
          r={6}
          fill="none"
          stroke={mono ? colors.text : q2}
          strokeWidth={1.6}
        />
        {/* Center dot */}
        <Circle
          cx={q2x + tile / 2}
          cy={q2y + tile / 2}
          r={2}
          fill={mono ? colors.text : q2}
        />
        {/* Crosshair ticks — N/S/E/W */}
        <Line
          x1={q2x + tile / 2}
          y1={q2y + 2}
          x2={q2x + tile / 2}
          y2={q2y + 4.5}
          stroke={mono ? colors.text : q2}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <Line
          x1={q2x + tile / 2}
          y1={q2y + tile - 2}
          x2={q2x + tile / 2}
          y2={q2y + tile - 4.5}
          stroke={mono ? colors.text : q2}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <Line
          x1={q2x + 2}
          y1={q2y + tile / 2}
          x2={q2x + 4.5}
          y2={q2y + tile / 2}
          stroke={mono ? colors.text : q2}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <Line
          x1={q2x + tile - 2}
          y1={q2y + tile / 2}
          x2={q2x + tile - 4.5}
          y2={q2y + tile / 2}
          stroke={mono ? colors.text : q2}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
