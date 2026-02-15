import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useWeeklyGoals } from "../../src/hooks/useWeeklyGoals";
import { useRoles } from "../../src/hooks/useRoles";
import { Quadrant } from "../../src/models/WeeklyGoal";
import { QUADRANT_LABELS, QUADRANT_COLORS } from "../../src/utils/constants";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/theme/colors";
import { spacing, borderRadius } from "../../src/theme/spacing";

export default function EditGoalScreen() {
  const { id, weekStartDate } = useLocalSearchParams<{
    id: string;
    weekStartDate: string;
  }>();

  const { goals, isLoading, updateGoal, deleteGoal } = useWeeklyGoals(weekStartDate || "");
  const { roles } = useRoles();
  const activeRoles = roles.filter((r) => r.active);

  const goal = goals.find((g) => g.id === id);

  const [roleId, setRoleId] = useState("");
  const [goalText, setGoalText] = useState("");
  const [quadrant, setQuadrant] = useState<Quadrant>(2);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (goal) {
      setRoleId(goal.roleId);
      setGoalText(goal.goalText);
      setQuadrant(goal.quadrant);
      setNotes(goal.notes);
    }
  }, [goal?.id]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Goal not found.</Text>
      </View>
    );
  }

  const canSave = goalText.trim().length > 0 && roleId.length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await updateGoal({
        ...goal,
        roleId,
        goalText: goalText.trim(),
        quadrant,
        notes: notes.trim(),
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
        await deleteGoal(goal.id);
        router.back();
      } catch {
        setSaving(false);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Delete this goal?`)) {
        doDelete();
      }
    } else {
      Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator>
        <Text style={styles.label}>Role</Text>
        <View style={styles.chipRow}>
          {activeRoles.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => setRoleId(r.id)}
              style={[styles.chip, roleId === r.id && styles.chipSelected]}
            >
              <Text style={[styles.chipText, roleId === r.id && styles.chipTextSelected]}>
                {r.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Goal</Text>
        <TextInput
          style={styles.input}
          value={goalText}
          onChangeText={setGoalText}
          placeholder="What do you want to accomplish?"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.label}>Quadrant</Text>
        <View style={styles.quadrantGrid}>
          {([1, 2, 3, 4] as Quadrant[]).map((q) => (
            <Pressable
              key={q}
              onPress={() => setQuadrant(q)}
              style={[
                styles.quadrantButton,
                {
                  borderColor: QUADRANT_COLORS[q],
                  backgroundColor: quadrant === q ? QUADRANT_COLORS[q] + "15" : "transparent",
                },
                quadrant === q && { borderWidth: 2 },
              ]}
            >
              <Text
                style={[
                  styles.quadrantLabel,
                  { color: QUADRANT_COLORS[q] },
                  quadrant === q && { fontWeight: "700" },
                ]}
              >
                {QUADRANT_LABELS[q]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional details, steps, or context"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
        />

        {/* Calendar link */}
        {goal.calendarEventId ? (
          <Pressable
            onPress={() => router.push(`/event/${goal.calendarEventId}`)}
            style={({ pressed }) => [
              styles.calendarButton,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="calendar" size={18} color={colors.primary} />
            <Text style={styles.calendarButtonText}>View Calendar Event</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() =>
              router.push(
                `/event/new?goalId=${goal.id}&goalText=${encodeURIComponent(
                  goal.goalText
                )}&weekStartDate=${goal.weekStartDate}`
              )
            }
            style={({ pressed }) => [
              styles.calendarButton,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.calendarButtonText}>Schedule to Calendar</Text>
          </Pressable>
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
          style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.deleteText}>Delete Goal</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  quadrantGrid: {
    gap: spacing.sm,
  },
  quadrantButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  quadrantLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  calendarButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: spacing.lg,
    justifyContent: "center",
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
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
