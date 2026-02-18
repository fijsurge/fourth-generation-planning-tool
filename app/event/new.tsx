import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useCalendarEvents } from "../../src/hooks/useCalendarEvents";
import { useAuth } from "../../src/auth/AuthContext";
import {
  getWeeklyGoalsByWeek,
  updateWeeklyGoal,
} from "../../src/api/googleSheets";
import { EventTransparency } from "../../src/models/CalendarEvent";
import { useSettings } from "../../src/contexts/SettingsContext";
import {
  WebDateTimePicker,
  dateTimeToPickerValues,
  pickerValuesToDateTimeString,
} from "../../src/components/WebDateTimePicker";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { useRoles } from "../../src/hooks/useRoles";
import { ColorPicker } from "../../src/components/ColorPicker";

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toLocalDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

export default function NewEventScreen() {
  const colors = useThemeColors();
  const params = useLocalSearchParams<{
    date?: string;
    goalId?: string;
    goalText?: string;
    weekStartDate?: string;
    roleId?: string;
  }>();

  const { createEvent } = useCalendarEvents();
  const { getValidAccessToken } = useAuth();
  const { defaultAttendees } = useSettings();
  const { roles } = useRoles();

  const initialDate = params.date ? new Date(params.date) : new Date();
  if (!params.date) {
    initialDate.setMinutes(0, 0, 0);
    initialDate.setHours(initialDate.getHours() + 1);
  }
  const initialEnd = new Date(initialDate.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState(params.goalText || "");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startStr, setStartStr] = useState(toLocalDateTimeString(initialDate));
  const [endStr, setEndStr] = useState(toLocalDateTimeString(initialEnd));
  const [startDateStr, setStartDateStr] = useState(
    toLocalDateString(initialDate)
  );
  const [endDateStr, setEndDateStr] = useState(
    toLocalDateString(initialEnd)
  );
  const [transparency, setTransparency] = useState<EventTransparency>("opaque");
  const [attendeesStr, setAttendeesStr] = useState(defaultAttendees);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultColorId = params.roleId
    ? roles.find((r) => r.id === params.roleId)?.colorId
    : undefined;
  const [colorId, setColorId] = useState<string | undefined>(defaultColorId);

  const updateStart = (newStartStr: string) => {
    const newStart = new Date(newStartStr).getTime();
    const currentEnd = new Date(endStr).getTime();
    // Only push end forward when start would meet or exceed end
    if (!isNaN(newStart) && !isNaN(currentEnd) && newStart >= currentEnd) {
      const oldStart = new Date(startStr).getTime();
      const duration = !isNaN(oldStart) ? currentEnd - oldStart : 60 * 60 * 1000;
      setEndStr(toLocalDateTimeString(new Date(newStart + duration)));
    }
    setStartStr(newStartStr);
  };

  const updateStartDate = (newDateStr: string) => {
    const newStart = new Date(newDateStr).getTime();
    const currentEnd = new Date(endDateStr).getTime();
    if (!isNaN(newStart) && !isNaN(currentEnd) && newStart >= currentEnd) {
      const oldStart = new Date(startDateStr).getTime();
      const duration = !isNaN(oldStart) ? currentEnd - oldStart : 24 * 60 * 60 * 1000;
      setEndDateStr(toLocalDateString(new Date(newStart + duration)));
    }
    setStartDateStr(newDateStr);
  };

  const canSave = title.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      let startTime: string;
      let endTime: string;

      if (allDay) {
        startTime = startDateStr;
        const end = new Date(endDateStr);
        end.setDate(end.getDate() + 1);
        endTime = toLocalDateString(end);
      } else {
        startTime = new Date(startStr).toISOString();
        endTime = new Date(endStr).toISOString();
      }

      const attendees = attendeesStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((email) => ({ email }));

      const created = await createEvent({
        title: title.trim(),
        description: description.trim(),
        startTime,
        endTime,
        allDay,
        linkedGoalId: params.goalId || undefined,
        attendees: attendees.length > 0 ? attendees : undefined,
        transparency,
        colorId,
      });

      if (params.goalId && params.weekStartDate) {
        try {
          const token = await getValidAccessToken();
          const goals = await getWeeklyGoalsByWeek(token, params.weekStartDate);
          const goal = goals.find((g) => g.id === params.goalId);
          if (goal) {
            await updateWeeklyGoal(token, {
              ...goal,
              calendarEventId: created.id,
              calendarSource: "google",
              updatedAt: new Date().toISOString(),
            });
          }
        } catch {
          // Goal update failed but event was created — not critical
        }
      }

      router.back();
    } catch (err: any) {
      const msg = err?.message || "Failed to create event";
      setError(msg);
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Error", msg);
      }
      setSaving(false);
    }
  };

  const webInputStyle: React.CSSProperties = {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "solid",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    form: {
      padding: spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    multiline: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    switchRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.md,
    },
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: "center",
      borderRadius: borderRadius.sm,
    },
    segmentButtonActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: colors.onPrimary,
    },
    hint: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: spacing.md,
      fontStyle: "italic",
    },
    errorText: {
      fontSize: 13,
      color: colors.danger,
      marginTop: spacing.md,
    },
    button: {
      backgroundColor: colors.primary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: "center",
      marginTop: spacing.lg,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
  }), [colors]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Event title"
          placeholderTextColor={colors.textMuted}
          autoFocus
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>All-day</Text>
          <Switch
            value={allDay}
            onValueChange={setAllDay}
            trackColor={{ true: colors.primary }}
          />
        </View>

        <Text style={styles.label}>Show as</Text>
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setTransparency("opaque")}
            style={[
              styles.segmentButton,
              transparency === "opaque" && styles.segmentButtonActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                transparency === "opaque" && styles.segmentTextActive,
              ]}
            >
              Busy
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTransparency("transparent")}
            style={[
              styles.segmentButton,
              transparency === "transparent" && styles.segmentButtonActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                transparency === "transparent" && styles.segmentTextActive,
              ]}
            >
              Free
            </Text>
          </Pressable>
        </View>

        {allDay ? (
          <>
            <Text style={styles.label}>Start Date</Text>
            {Platform.OS === "web" ? (
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => updateStartDate(e.target.value)}
                style={webInputStyle}
              />
            ) : (
              <TextInput
                style={styles.input}
                value={startDateStr}
                onChangeText={updateStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            )}

            <Text style={styles.label}>End Date</Text>
            {Platform.OS === "web" ? (
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                style={webInputStyle}
              />
            ) : (
              <TextInput
                style={styles.input}
                value={endDateStr}
                onChangeText={setEndDateStr}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            )}
          </>
        ) : (
          <>
            <Text style={styles.label}>Start</Text>
            {Platform.OS === "web" ? (
              (() => {
                const v = dateTimeToPickerValues(startStr);
                return (
                  <WebDateTimePicker
                    dateValue={v.date}
                    hourValue={v.hour}
                    minuteValue={v.minute}
                    onDateChange={(d) => updateStart(pickerValuesToDateTimeString(d, v.hour, v.minute))}
                    onHourChange={(h) => updateStart(pickerValuesToDateTimeString(v.date, h, v.minute))}
                    onMinuteChange={(m) => updateStart(pickerValuesToDateTimeString(v.date, v.hour, m))}
                  />
                );
              })()
            ) : (
              <TextInput
                style={styles.input}
                value={startStr}
                onChangeText={updateStart}
                placeholder="YYYY-MM-DDTHH:MM"
                placeholderTextColor={colors.textMuted}
              />
            )}

            <Text style={styles.label}>End</Text>
            {Platform.OS === "web" ? (
              (() => {
                const v = dateTimeToPickerValues(endStr);
                return (
                  <WebDateTimePicker
                    dateValue={v.date}
                    hourValue={v.hour}
                    minuteValue={v.minute}
                    onDateChange={(d) => setEndStr(pickerValuesToDateTimeString(d, v.hour, v.minute))}
                    onHourChange={(h) => setEndStr(pickerValuesToDateTimeString(v.date, h, v.minute))}
                    onMinuteChange={(m) => setEndStr(pickerValuesToDateTimeString(v.date, v.hour, m))}
                  />
                );
              })()
            ) : (
              <TextInput
                style={styles.input}
                value={endStr}
                onChangeText={setEndStr}
                placeholder="YYYY-MM-DDTHH:MM"
                placeholderTextColor={colors.textMuted}
              />
            )}
          </>
        )}

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add a description"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Attendees (optional)</Text>
        <TextInput
          style={styles.input}
          value={attendeesStr}
          onChangeText={setAttendeesStr}
          placeholder="Comma-separated emails"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Color (optional)</Text>
        <ColorPicker value={colorId} onChange={setColorId} />

        {params.goalId && (
          <Text style={styles.hint}>
            Linked to goal: {params.goalText}
          </Text>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          style={({ pressed }) => [
            styles.button,
            !canSave && styles.buttonDisabled,
            pressed && { opacity: 0.8 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Save Event</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
