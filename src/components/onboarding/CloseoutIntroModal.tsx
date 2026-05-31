import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../contexts/SettingsContext";
import { useThemeColors } from "../../theme/useThemeColors";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import { elevation } from "../../theme/elevation";

interface CloseoutIntroModalProps {
  visible: boolean;
  /** Called when she chooses "Walk me through it" — opens the real CloseoutModal. */
  onContinueToCloseout: () => void;
  /** Called when she chooses "I'll do this later" — just closes the intro. */
  onDismiss: () => void;
}

export function CloseoutIntroModal({
  visible,
  onContinueToCloseout,
  onDismiss,
}: CloseoutIntroModalProps) {
  const colors = useThemeColors();
  const { completeCloseoutOnboarding } = useSettings();

  const handleContinue = () => {
    completeCloseoutOnboarding().catch(() => { /* silent */ });
    onContinueToCloseout();
  };

  const handleSkip = () => {
    completeCloseoutOnboarding().catch(() => { /* silent */ });
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
              ...elevation.lg,
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.primaryLight, borderColor: colors.primary },
            ]}
          >
            <Ionicons name="leaf-outline" size={28} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Your first week is wrapping up
          </Text>

          <Text style={[styles.body, { color: colors.textSecondary }]}>
            The other half of Covey's practice is a brief weekly reflection: what
            went well, what didn't, what you'll change next week. It only takes a
            few minutes — and it's where the framework actually compounds over time.
          </Text>

          <Text style={[styles.body, { color: colors.textSecondary, fontStyle: "italic" }]}>
            We'll walk you through it once, then it's just a familiar checklist
            each Sunday (or whenever you've set your closeout day).
          </Text>

          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
              Walk me through it
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
              I'll do this later
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.h1,
    textAlign: "center",
  },
  body: {
    ...typography.body,
    textAlign: "center",
    lineHeight: 22,
  },
  primaryButton: {
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    ...typography.body,
    fontWeight: "600",
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryButtonText: {
    ...typography.body,
    fontWeight: "600",
  },
});
