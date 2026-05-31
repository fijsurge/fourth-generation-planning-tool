import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useWeeklyGoals } from "../../src/hooks/useWeeklyGoals";
import { useRoles } from "../../src/hooks/useRoles";
import { Quadrant, RecurringCadence } from "../../src/models/WeeklyGoal";
import { QUADRANT_LABELS, getQuadrantColors } from "../../src/utils/constants";
import { DatePickerField } from "../../src/components/DateTimePickerField";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { goalEvents } from "../../src/utils/goalEvents";
import { SpotlightCallout } from "../../src/components/onboarding/SpotlightCallout";

export default function NewGoalScreen() {
  const colors = useThemeColors();
  const QUADRANT_COLORS = getQuadrantColors(colors);
  const { weekStartDate, roleId: preselectedRoleId } = useLocalSearchParams<{
    weekStartDate: string;
    roleId?: string;
  }>();

  const { addGoal } = useWeeklyGoals(weekStartDate || "");
  const { roles } = useRoles();
  const activeRoles = roles.filter((r) => r.active);

  const [roleId, setRoleId] = useState(preselectedRoleId || "");
  const [goalText, setGoalText] = useState("");
  const [quadrant, setQuadrant] = useState<Quadrant>(2);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isBigRock, setIsBigRock] = useState(false);
  const [priority, setPriority] = useState<number | null>(null);
  const [recurringCadence, setRecurringCadence] = useState<RecurringCadence | null>(null);
  const [recurringEndType, setRecurringEndType] = useState<"none" | "date" | "count">("none");
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [recurringCount, setRecurringCount] = useState(1);

  const canSave = goalText.trim().length > 0 && roleId.length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const isRecurring = recurringCadence !== null;
      const recurringEnds =
        isRecurring && recurringEndType === "date" && recurringEndDate
          ? recurringEndDate
          : undefined;
      const recurringRemainingVal =
        isRecurring && recurringEndType === "count" && recurringCount > 0
          ? recurringCount
          : undefined;
      await addGoal({
        roleId,
        goalText: goalText.trim(),
        quadrant,
        notes: notes.trim(),
        isBigRock,
        priority: priority ?? undefined,
        recurring: isRecurring,
        recurringCadence: recurringCadence ?? undefined,
        recurringEnds,
        recurringRemaining: recurringRemainingVal,
      });
      goalEvents.emitGoalSaved();
      router.back();
    } catch (err: any) {
      setSaving(false);
      setSaveError(err?.message ?? "Failed to save goal. Please try again.");
    }
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
    hint: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: spacing.xs,
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
      marginTop: spacing.sm,
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
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: colors.onPrimary,
    },
    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    stepperButton: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
    },
    stepperValue: {
      minWidth: 40,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    stepperLabel: {
      fontSize: 14,
      color: colors.textMuted,
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
        {activeRoles.length === 0 && (
          <Text style={styles.hint}>Create a role in Settings first.</Text>
        )}

        <Text style={styles.label}>Goal</Text>
        <TextInput
          style={styles.input}
          value={goalText}
          onChangeText={setGoalText}
          placeholder="What do you want to accomplish?"
          placeholderTextColor={colors.textMuted}
          autoFocus={activeRoles.length > 0}
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
                  backgroundColor: quadrant === q ? QUADRANT_COLORS[q] : "transparent",
                },
                quadrant === q && { borderWidth: 2 },
              ]}
            >
              <Text
                style={[
                  styles.quadrantLabel,
                  { color: quadrant === q ? colors.onPrimary : QUADRANT_COLORS[q] },
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

        <Text style={styles.label}>Priority</Text>
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setIsBigRock((v) => !v)}
            style={[styles.chip, isBigRock && { borderColor: "#F59E0B", backgroundColor: "#FEF3C7" }]}
          >
            <Text style={[styles.chipText, isBigRock && { color: "#F59E0B", fontWeight: "600" }]}>
              ◆ Big Rock
            </Text>
          </Pressable>
        </View>
        <View style={styles.stepperRow}>
          <Pressable
            style={({ pressed }) => [styles.stepperButton, pressed && { opacity: 0.6 }]}
            onPress={() => setPriority((n) => (n == null || n <= 1) ? null : n - 1)}
          >
            <Ionicons name="remove" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.stepperValue}>{priority ?? "—"}</Text>
          <Pressable
            style={({ pressed }) => [styles.stepperButton, pressed && { opacity: 0.6 }]}
            onPress={() => setPriority((n) => (n == null ? 1 : n + 1))}
          >
            <Ionicons name="add" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.stepperLabel}>rank (optional)</Text>
        </View>

        <SpotlightCallout
          name="recurrence-picker"
          title="Make goals recurring"
          body="Set a goal to repeat weekly, monthly, quarterly, or yearly. It will auto-carry to next week so you don't have to re-add it."
        />

        <Text style={styles.label}>Repeat</Text>
        <View style={styles.chipRow}>
          {([null, "weekly", "monthly", "quarterly", "yearly"] as (RecurringCadence | null)[]).map((c) => (
            <Pressable
              key={c ?? "off"}
              onPress={() => { setRecurringCadence(c); if (!c) setRecurringEndType("none"); }}
              style={[styles.chip, recurringCadence === c && styles.chipSelected]}
            >
              <Text style={[styles.chipText, recurringCadence === c && styles.chipTextSelected]}>
                {c === null ? "Off" : c.charAt(0).toUpperCase() + c.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {recurringCadence !== null && (
          <>
            <View style={styles.segmentedControl}>
              {(["none", "date", "count"] as const).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setRecurringEndType(opt)}
                  style={[styles.segmentButton, recurringEndType === opt && styles.segmentButtonActive]}
                >
                  <Text style={[styles.segmentText, recurringEndType === opt && styles.segmentTextActive]}>
                    {opt === "none" ? "No end" : opt === "date" ? "End by date" : `End after N ${recurringCadence}s`}
                  </Text>
                </Pressable>
              ))}
            </View>
            {recurringEndType === "date" && (
              <>
                <Text style={styles.label}>End date</Text>
                <DatePickerField value={recurringEndDate} onChange={setRecurringEndDate} />
              </>
            )}
            {recurringEndType === "count" && (
              <View style={styles.stepperRow}>
                <Pressable
                  style={({ pressed }) => [styles.stepperButton, pressed && { opacity: 0.6 }]}
                  onPress={() => setRecurringCount((n) => Math.max(1, n - 1))}
                >
                  <Ionicons name="remove" size={18} color={colors.text} />
                </Pressable>
                <Text style={styles.stepperValue}>{recurringCount}</Text>
                <Pressable
                  style={({ pressed }) => [styles.stepperButton, pressed && { opacity: 0.6 }]}
                  onPress={() => setRecurringCount((n) => n + 1)}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                </Pressable>
                <Text style={styles.stepperLabel}>
                  {recurringCadence}{recurringCount !== 1 ? "s" : ""}
                </Text>
              </View>
            )}
          </>
        )}

        {saveError && (
          <Text style={{ color: colors.danger, fontSize: 13, marginTop: spacing.sm, textAlign: "center" }}>
            {saveError}
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
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Save Goal</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
