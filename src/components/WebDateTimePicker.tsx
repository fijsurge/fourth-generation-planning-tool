import React from "react";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

interface WebDateTimePickerProps {
  dateValue: string; // YYYY-MM-DD
  hourValue: number;
  minuteValue: number;
  onDateChange: (date: string) => void;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function WebDateTimePicker({
  dateValue,
  hourValue,
  minuteValue,
  onDateChange,
  onHourChange,
  onMinuteChange,
}: WebDateTimePickerProps) {
  const colors = useThemeColors();

  const baseStyle: React.CSSProperties = {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "solid",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const dateInputStyle: React.CSSProperties = {
    ...baseStyle,
    width: 170,
  };

  const selectStyle: React.CSSProperties = {
    ...baseStyle,
    width: 70,
    cursor: "pointer",
  };

  const colonStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  };

  return (
    <div style={containerStyle}>
      <select
        value={hourValue}
        onChange={(e) => onHourChange(Number(e.target.value))}
        style={selectStyle}
      >
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {pad(h)}
          </option>
        ))}
      </select>
      <span style={colonStyle}>:</span>
      <select
        value={minuteValue}
        onChange={(e) => onMinuteChange(Number(e.target.value))}
        style={selectStyle}
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {pad(m)}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={dateValue}
        onChange={(e) => onDateChange(e.target.value)}
        style={dateInputStyle}
      />
    </div>
  );
}

// Helpers to convert between the picker values and an ISO-like datetime string
export function dateTimeToPickerValues(datetimeStr: string) {
  const d = new Date(datetimeStr);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hour: d.getHours(),
    minute: d.getMinutes(),
  };
}

export function pickerValuesToDateTimeString(
  date: string,
  hour: number,
  minute: number
): string {
  return `${date}T${pad(hour)}:${pad(minute)}`;
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 8,
  width: "100%",
};
