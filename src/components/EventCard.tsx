import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { CalendarTouchableOpacityProps } from "react-native-big-calendar";
import { EventTransparency } from "../models/CalendarEvent";
import { useThemeColors } from "../theme/useThemeColors";
import { typography } from "../theme/typography";

interface BigCalendarEvent {
  start: Date;
  end: Date;
  title: string;
  color?: string;
  transparency?: EventTransparency;
}

export function EventCard(
  event: BigCalendarEvent,
  touchableOpacityProps: CalendarTouchableOpacityProps
) {
  const colors = useThemeColors();
  const baseColor = event.color || colors.calendarSource.google;
  const isFree = event.transparency === "transparent";

  return (
    <TouchableOpacity
      {...touchableOpacityProps}
      style={[
        touchableOpacityProps.style,
        {
          backgroundColor: isFree ? "transparent" : baseColor,
          borderRadius: 4,
          padding: 2,
          paddingHorizontal: 4,
          flex: 1,
          ...(isFree && {
            borderWidth: 1.5,
            borderColor: baseColor,
          }),
        },
      ]}
    >
      <Text
        numberOfLines={1}
        style={{ ...typography.caption, color: isFree ? baseColor : colors.onPrimary }}
      >
        {event.title}
      </Text>
    </TouchableOpacity>
  );
}
