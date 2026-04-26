import { GoalStatus } from "../models/WeeklyGoal";
import { STATUS_LABELS } from "../utils/constants";
import { useThemeColors } from "../theme/useThemeColors";
import { Pill } from "./Pill";

interface StatusBadgeProps {
  status: GoalStatus;
  onPress?: () => void;
}

export function StatusBadge({ status, onPress }: StatusBadgeProps) {
  const colors = useThemeColors();

  return (
    <Pill
      color={colors.status[status]}
      backgroundColor={colors.statusSoft[status]}
      onPress={onPress}
    >
      {STATUS_LABELS[status]}
    </Pill>
  );
}
