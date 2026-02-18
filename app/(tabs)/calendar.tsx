import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { Calendar, ICalendarEventBase, Mode } from "react-native-big-calendar";
import { router, useFocusEffect } from "expo-router";
import { useCalendarEvents } from "../../src/hooks/useCalendarEvents";
import { EventCard } from "../../src/components/EventCard";
import { EventTransparency } from "../../src/models/CalendarEvent";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { Ionicons } from "@expo/vector-icons";
import { colorIdToHex } from "../../src/utils/calendarColors";

interface BigCalendarEvent extends ICalendarEventBase {
  id: string;
  color?: string;
  transparency?: EventTransparency;
}

const MODES: { label: string; value: Mode }[] = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

function getDateRange(date: Date, mode: Mode): { timeMin: string; timeMax: string } {
  const d = new Date(date);
  let start: Date;
  let end: Date;

  if (mode === "day") {
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  } else if (mode === "week") {
    const day = d.getDay();
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
    end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (7 - day));
  } else {
    start = new Date(d.getFullYear(), d.getMonth(), -6);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 7);
  }

  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

export default function CalendarScreen() {
  const colors = useThemeColors();
  const { height } = useWindowDimensions();
  const { events, isLoading, loadEvents } = useCalendarEvents();
  const [mode, setMode] = useState<Mode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchEvents = useCallback(
    (date: Date, m: Mode) => {
      const { timeMin, timeMax } = getDateRange(date, m);
      loadEvents(timeMin, timeMax);
    },
    [loadEvents]
  );

  useFocusEffect(
    useCallback(() => {
      fetchEvents(currentDate, mode);
    }, [currentDate, mode, fetchEvents])
  );

  const calendarEvents: BigCalendarEvent[] = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        start: new Date(e.startTime),
        end: new Date(e.endTime),
        color: colorIdToHex(e.colorId, colors.calendarSource.google),
        transparency: e.transparency,
      })),
    [events, colors]
  );

  const handlePressEvent = (event: BigCalendarEvent) => {
    router.push(`/event/${event.id}`);
  };

  const handlePressCell = (date: Date) => {
    router.push(`/event/new?date=${date.toISOString()}`);
  };

  const handleSwipeEnd = useCallback(
    (date: Date) => {
      setCurrentDate(date);
    },
    []
  );

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const navigateDate = (direction: 1 | -1) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (mode === "day") {
        d.setDate(d.getDate() + direction);
      } else if (mode === "week") {
        d.setDate(d.getDate() + 7 * direction);
      } else {
        d.setMonth(d.getMonth() + direction);
      }
      return d;
    });
  };

  const calendarHeight = height - 180;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    toolbar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modeRow: {
      flexDirection: "row",
      gap: 4,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: 2,
    },
    modeButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
    },
    modeButtonActive: {
      backgroundColor: colors.primary,
    },
    modeText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    modeTextActive: {
      color: colors.onPrimary,
    },
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    navButton: {
      padding: spacing.sm,
      borderRadius: borderRadius.md,
    },
    todayButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    todayText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    loader: {
      position: "absolute",
      top: 60,
      right: spacing.md,
      zIndex: 10,
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.modeRow}>
          {MODES.map((m) => (
            <Pressable
              key={m.value}
              onPress={() => setMode(m.value)}
              style={[styles.modeButton, mode === m.value && styles.modeButtonActive]}
            >
              <Text
                style={[
                  styles.modeText,
                  mode === m.value && styles.modeTextActive,
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.navRow}>
          <Pressable onPress={() => navigateDate(-1)} style={styles.navButton}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={goToToday} style={styles.todayButton}>
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
          <Pressable onPress={() => navigateDate(1)} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {isLoading && (
        <ActivityIndicator
          style={styles.loader}
          size="small"
          color={colors.primary}
        />
      )}

      <Calendar
        events={calendarEvents}
        height={calendarHeight}
        mode={mode}
        date={currentDate}
        onPressEvent={handlePressEvent}
        onPressCell={handlePressCell}
        onSwipeEnd={handleSwipeEnd}
        renderEvent={EventCard}
        scrollOffsetMinutes={Math.max(0, new Date().getHours() * 60 - 60)}
        showVerticalScrollIndicator
        swipeEnabled
        weekStartsOn={0}
        showAdjacentMonths
      />

      <Pressable
        onPress={() => router.push("/event/new")}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}
      >
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}
