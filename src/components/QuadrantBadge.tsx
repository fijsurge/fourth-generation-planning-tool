import { Quadrant } from "../models/WeeklyGoal";
import { QUADRANT_SHORT_LABELS } from "../utils/constants";
import { useThemeColors } from "../theme/useThemeColors";
import { Pill } from "./Pill";

interface QuadrantBadgeProps {
  quadrant: Quadrant;
}

export function QuadrantBadge({ quadrant }: QuadrantBadgeProps) {
  const colors = useThemeColors();

  return (
    <Pill
      color={colors.quadrant[`q${quadrant}` as "q1" | "q2" | "q3" | "q4"]}
      backgroundColor={colors.quadrantSoft[`q${quadrant}` as "q1" | "q2" | "q3" | "q4"]}
      bordered={false}
    >
      {QUADRANT_SHORT_LABELS[quadrant]}
    </Pill>
  );
}
