import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWeeklyGoals } from "../hooks/useWeeklyGoals";
import { useWeeklyReflection } from "../hooks/useWeeklyReflection";
import { QuadrantBadge } from "./QuadrantBadge";
import { formatWeekKey, formatWeekRange } from "../utils/dates";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";

interface CloseoutModalProps {
  visible: boolean;
  prevWeekStart: Date;
  currentWeekStart: Date;
  onClose: () => void;
  onComplete: () => void;
}

export function CloseoutModal({
  visible,
  prevWeekStart,
  currentWeekStart,
  onClose,
  onComplete,
}: CloseoutModalProps) {
  const colors = useThemeColors();
  const prevWeekKey = formatWeekKey(prevWeekStart);
  const currentWeekKey = formatWeekKey(currentWeekStart);
  const prevWeekLabel = formatWeekRange(prevWeekStart);
  const currentWeekLabel = formatWeekRange(currentWeekStart);

  const { goals, isLoading: goalsLoading, moveGoalToWeek } = useWeeklyGoals(prevWeekKey);
  const { saveReflection } = useWeeklyReflection(prevWeekKey);

  const incompleteGoals = goals.filter((g) => g.status !== "complete");

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [wentWell, setWentWell] = useState("");
  const [didntGoWell, setDidntGoWell] = useState("");
  const [intentions, setIntentions] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset form fields when modal opens (or on mount with conditional rendering)
  useEffect(() => {
    if (visible) {
      setWentWell("");
      setDidntGoWell("");
      setIntentions("");
      setSaving(false);
      setSaveError(null);
    }
  }, [visible]);

  // Seed checkboxes once after goals finish loading.
  // With conditional rendering the modal mounts after showCloseout becomes true,
  // so goals aren't loaded yet when the form-reset effect runs above.
  useEffect(() => {
    if (!goalsLoading) {
      setCheckedIds(new Set(incompleteGoals.map((g) => g.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalsLoading]);

  const toggleGoal = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setCheckedIds(new Set(incompleteGoals.map((g) => g.id)));
  }, [incompleteGoals]);

  const deselectAll = useCallback(() => {
    setCheckedIds(new Set());
  }, []);

  const moveCheckedGoals = async () => {
    await Promise.all(
      Array.from(checkedIds).map((id) => moveGoalToWeek(id, currentWeekKey))
    );
  };

  const handleCloseOut = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await moveCheckedGoals();
      await saveReflection({ wentWell, didntGoWell, intentions });
      onComplete();
    } catch (err: any) {
      setSaveError(err.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await moveCheckedGoals();
      onClose();
    } catch (err: any) {
      setSaveError(err.message || "Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.lg,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90%",
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
        },
        headerTextGroup: {
          flex: 1,
        },
        headerTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
        },
        headerSubtitle: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 2,
        },
        closeButton: {
          padding: spacing.xs,
          marginLeft: spacing.sm,
        },
        scrollContent: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
        },
        sectionHeader: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.textMuted,
          letterSpacing: 0.8,
          marginTop: spacing.md,
          marginBottom: spacing.sm,
        },
        subhead: {
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: spacing.sm,
        },
        allCompleteText: {
          fontSize: 14,
          color: colors.successText,
          paddingVertical: spacing.sm,
        },
        goalRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: spacing.xs,
          gap: spacing.sm,
        },
        goalText: {
          flex: 1,
          fontSize: 14,
          color: colors.text,
        },
        selectLinks: {
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.xs,
        },
        selectLink: {
          fontSize: 13,
          color: colors.primary,
        },
        divider: {
          height: 1,
          backgroundColor: colors.border,
          marginVertical: spacing.md,
        },
        inputLabel: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
          marginBottom: spacing.xs,
          marginTop: spacing.sm,
        },
        textInput: {
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: borderRadius.md,
          padding: spacing.sm,
          fontSize: 14,
          color: colors.text,
          minHeight: 70,
          textAlignVertical: "top",
        },
        errorText: {
          fontSize: 13,
          color: colors.danger,
          marginTop: spacing.sm,
        },
        closeOutButton: {
          backgroundColor: colors.primary,
          padding: spacing.md,
          borderRadius: borderRadius.md,
          alignItems: "center",
          marginTop: spacing.lg,
        },
        closeOutButtonText: {
          color: colors.onPrimary,
          fontSize: 15,
          fontWeight: "600",
        },
        skipLink: {
          alignItems: "center",
          padding: spacing.sm,
          marginTop: spacing.xs,
        },
        skipLinkText: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        loaderContainer: {
          padding: spacing.xl,
          alignItems: "center",
        },
      }),
    [colors]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Week Closeout</Text>
              <Text style={styles.headerSubtitle}>{prevWeekLabel}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.6 }]}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Incomplete Goals Section */}
            <Text style={styles.sectionHeader}>INCOMPLETE GOALS</Text>
            <Text style={styles.subhead}>
              Select goals to move to {currentWeekLabel}
            </Text>

            {goalsLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : incompleteGoals.length === 0 ? (
              <Text style={styles.allCompleteText}>
                All goals were completed! 🎉
              </Text>
            ) : (
              <>
                {incompleteGoals.map((goal) => {
                  const checked = checkedIds.has(goal.id);
                  return (
                    <Pressable
                      key={goal.id}
                      style={styles.goalRow}
                      onPress={() => toggleGoal(goal.id)}
                    >
                      <Ionicons
                        name={checked ? "checkbox" : "square-outline"}
                        size={22}
                        color={checked ? colors.primary : colors.textMuted}
                      />
                      <Text style={styles.goalText} numberOfLines={2}>
                        {goal.goalText}
                      </Text>
                      <QuadrantBadge quadrant={goal.quadrant} />
                    </Pressable>
                  );
                })}
                <View style={styles.selectLinks}>
                  <Pressable onPress={selectAll}>
                    <Text style={styles.selectLink}>Select All</Text>
                  </Pressable>
                  <Pressable onPress={deselectAll}>
                    <Text style={styles.selectLink}>Deselect All</Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Reflection Section */}
            <Text style={styles.sectionHeader}>REFLECTION</Text>

            <Text style={styles.inputLabel}>What went well?</Text>
            <TextInput
              style={styles.textInput}
              value={wentWell}
              onChangeText={setWentWell}
              multiline
              placeholder="Share what worked..."
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.inputLabel}>What didn't go well?</Text>
            <TextInput
              style={styles.textInput}
              value={didntGoWell}
              onChangeText={setDidntGoWell}
              multiline
              placeholder="Share what was challenging..."
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.inputLabel}>Intentions for next week</Text>
            <TextInput
              style={styles.textInput}
              value={intentions}
              onChangeText={setIntentions}
              multiline
              placeholder="What do you intend to focus on?"
              placeholderTextColor={colors.textMuted}
            />

            {saveError && (
              <Text style={styles.errorText}>{saveError}</Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.closeOutButton,
                (pressed || saving) && { opacity: 0.8 },
              ]}
              onPress={handleCloseOut}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={styles.closeOutButtonText}>Close Out Week</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.skipLink, pressed && { opacity: 0.6 }]}
              onPress={handleSkip}
              disabled={saving}
            >
              <Text style={styles.skipLinkText}>Skip Reflection</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
