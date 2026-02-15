import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { CalendarTouchableOpacityProps } from "react-native-big-calendar";
import { EventTransparency } from "../models/CalendarEvent";
import { colors } from "../theme/colors";

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
        style={{ color: isFree ? baseColor : "#fff", fontSize: 12 }}
      >
        {event.title}
      </Text>
    </TouchableOpacity>
  );
}
