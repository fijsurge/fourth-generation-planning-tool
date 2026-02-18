import { useState, useMemo } from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";
import { shiftWeek, formatWeekRange, formatWeekKey } from "../utils/dates";

interface WeekPickerModalProps {
  visible: boolean;
  currentWeekStart: Date;
  onMove?: (targetWeekDate: string) => void;
  onCopy: (targetWeekDate: string) => void;
  onClose: () => void;
}

export function WeekPickerModal({
  visible,
  currentWeekStart,
  onMove,
  onCopy,
  onClose,
}: WeekPickerModalProps) {
  const colors = useThemeColors();
  const [selectedWeek, setSelectedWeek] = useState<Date>(() =>
    shiftWeek(currentWeekStart, 1)
  );

  // Reset to next week whenever the modal opens
  const handleVisible = (nextVisible: boolean) => {
    if (nextVisible) {
      setSelectedWeek(shiftWeek(currentWeekStart, 1));
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "center",
          alignItems: "center",
          padding: spacing.lg,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          width: "100%",
          maxWidth: 380,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
        },
        title: {
          fontSize: 17,
          fontWeight: "700",
          color: colors.text,
          textAlign: "center",
          marginBottom: spacing.lg,
        },
        weekRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.lg,
        },
        weekLabel: {
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          textAlign: "center",
          flex: 1,
        },
        arrowButton: {
          padding: spacing.sm,
          borderRadius: borderRadius.md,
        },
        moveButton: {
          backgroundColor: colors.primary,
          padding: spacing.md,
          borderRadius: borderRadius.md,
          alignItems: "center",
          marginBottom: spacing.sm,
        },
        moveButtonText: {
          color: colors.onPrimary,
          fontSize: 15,
          fontWeight: "600",
        },
        copyButton: {
          padding: spacing.md,
          borderRadius: borderRadius.md,
          alignItems: "center",
          marginBottom: spacing.sm,
          borderWidth: 1,
          borderColor: colors.primary,
        },
        copyButtonText: {
          color: colors.primary,
          fontSize: 15,
          fontWeight: "600",
        },
        cancelButton: {
          padding: spacing.sm,
          alignItems: "center",
          marginTop: spacing.xs,
        },
        cancelText: {
          color: colors.textSecondary,
          fontSize: 14,
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
      onShow={() => handleVisible(true)}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{onMove ? "Move or Copy to week" : "Copy to week"}</Text>

          <View style={styles.weekRow}>
            <Pressable
              style={({ pressed }) => [styles.arrowButton, pressed && { opacity: 0.6 }]}
              onPress={() => setSelectedWeek((w) => shiftWeek(w, -1))}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </Pressable>

            <Text style={styles.weekLabel}>{formatWeekRange(selectedWeek)}</Text>

            <Pressable
              style={({ pressed }) => [styles.arrowButton, pressed && { opacity: 0.6 }]}
              onPress={() => setSelectedWeek((w) => shiftWeek(w, 1))}
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.primary} />
            </Pressable>
          </View>

          {onMove && (
            <Pressable
              style={({ pressed }) => [styles.moveButton, pressed && { opacity: 0.8 }]}
              onPress={() => onMove(formatWeekKey(selectedWeek))}
            >
              <Text style={styles.moveButtonText}>Move to this week</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.copyButton, pressed && { opacity: 0.8 }]}
            onPress={() => onCopy(formatWeekKey(selectedWeek))}
          >
            <Text style={styles.copyButtonText}>Copy to this week</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.6 }]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
