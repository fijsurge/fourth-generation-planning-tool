import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../contexts/SettingsContext";
import { useThemeColors } from "../../theme/useThemeColors";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export function OnboardingBanner() {
  const colors = useThemeColors();
  const { shouldShowOnboardingBanner, openOnboarding } = useSettings();

  if (!shouldShowOnboardingBanner) return null;

  return (
    <Pressable
      onPress={() => openOnboarding()}
      style={({ pressed }) => [
        styles.banner,
        {
          backgroundColor: colors.primaryLight,
          borderColor: colors.primary,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
      <Text style={[styles.text, { color: colors.primary }]}>
        New here? Take the 5-minute tour
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  text: {
    ...typography.body,
    fontWeight: "600",
    flex: 1,
  },
});
