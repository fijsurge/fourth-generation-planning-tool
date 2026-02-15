import { useState, useEffect } from "react";
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
import { EventTransparency } from "../../src/models/CalendarEvent";
import { colors } from "../../src/theme/colors";
import { spacing, borderRadius } from "../../src/theme/spacing";

const STATUS_COLORS: Record<string, string> = {
  accepted: "#16a34a",
  declined: "#dc2626",
  tentative: "#d97706",
  needsAction: "#9ca3af",
};

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

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, updateEvent, deleteEvent } = useCalendarEvents();

  const event = events.find((e) => e.id === id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startStr, setStartStr] = useState("");
  const [endStr, setEndStr] = useState("");
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [transparency, setTransparency] = useState<EventTransparency>("opaque");
  const [attendeesStr, setAttendeesStr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setAllDay(event.allDay);
      setTransparency(event.transparency || "opaque");
      setAttendeesStr(
        (event.attendees || []).map((a) => a.email).join(", ")
      );
      if (event.allDay) {
        setStartDateStr(event.startTime);
        setEndDateStr(event.endTime);
      } else {
        setStartStr(toLocalDateTimeString(new Date(event.startTime)));
        setEndStr(toLocalDateTimeString(new Date(event.endTime)));
        setStartDateStr(toLocalDateString(new Date(event.startTime)));
        setEndDateStr(toLocalDateString(new Date(event.endTime)));
      }
    }
  }, [event?.id]);

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Event not found.</Text>
        <Text style={styles.hintText}>
          Navigate here from the calendar to edit events.
        </Text>
      </View>
    );
  }

  const canSave = title.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
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

      await updateEvent(id!, {
        title: title.trim(),
        description: description.trim(),
        startTime,
        endTime,
        allDay,
        attendees: attendees.length > 0 ? attendees : undefined,
        transparency,
      });
      router.back();
    } catch {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      setSaving(true);
      try {
        await deleteEvent(id!);
        router.back();
      } catch {
        setSaving(false);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Delete this event?")) {
        doDelete();
      }
    } else {
      Alert.alert(
        "Delete Event",
        "Are you sure you want to delete this event?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Event title"
          placeholderTextColor={colors.textMuted}
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
                onChange={(e) => setStartDateStr(e.target.value)}
                style={webInputStyle}
              />
            ) : (
              <TextInput
                style={styles.input}
                value={startDateStr}
                onChangeText={setStartDateStr}
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
              <input
                type="datetime-local"
                value={startStr}
                onChange={(e) => setStartStr(e.target.value)}
                style={webInputStyle}
              />
            ) : (
              <TextInput
                style={styles.input}
                value={startStr}
                onChangeText={setStartStr}
                placeholder="YYYY-MM-DDTHH:MM"
                placeholderTextColor={colors.textMuted}
              />
            )}

            <Text style={styles.label}>End</Text>
            {Platform.OS === "web" ? (
              <input
                type="datetime-local"
                value={endStr}
                onChange={(e) => setEndStr(e.target.value)}
                style={webInputStyle}
              />
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

        {event.attendees && event.attendees.length > 0 && (
          <View style={styles.attendeeList}>
            {event.attendees.map((a) => (
              <View key={a.email} style={styles.attendeeRow}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        STATUS_COLORS[a.responseStatus || "needsAction"],
                    },
                  ]}
                />
                <Text style={styles.attendeeEmail}>{a.email}</Text>
                <Text style={styles.attendeeStatus}>
                  {a.responseStatus || "needsAction"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {event.linkedGoalId && (
          <Text style={styles.linkedGoal}>
            Linked to a weekly goal
          </Text>
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
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </Pressable>

        <Pressable
          onPress={handleDelete}
          disabled={saving}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.deleteText}>Delete Event</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  hintText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
    color: "#fff",
  },
  attendeeList: {
    marginTop: spacing.sm,
    gap: 6,
  },
  attendeeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  attendeeEmail: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  attendeeStatus: {
    fontSize: 12,
    color: colors.textMuted,
  },
  linkedGoal: {
    fontSize: 13,
    color: colors.primary,
    marginTop: spacing.md,
    fontStyle: "italic",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  deleteText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "600",
  },
});
