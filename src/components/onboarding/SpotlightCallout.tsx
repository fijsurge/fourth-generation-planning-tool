import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../contexts/SettingsContext";
import { useThemeColors } from "../../theme/useThemeColors";
import { spacing, borderRadius } from "../../theme/spacing";
import { typography } from "../../theme/typography";

interface SpotlightCalloutProps {
  name: string;
  title: string;
  body: string;
}

export function SpotlightCallout({ name, title, body }: SpotlightCalloutProps) {
  const colors = useThemeColors();
  const { isSpotlightDismissed, dismissSpotlight } = useSettings();

  if (isSpotlightDismissed(name)) return null;

  const handleDismiss = () => {
    dismissSpotlight(name).catch(() => { /* silent */ });
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.primaryLight,
          borderColor: colors.primary,
        },
      ]}
    >
      <View style={styles.header}>
        <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
        <Pressable
          onPress={handleDismiss}
          hitSlop={8}
          style={({ pressed }) => [pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="close" size={18} color={colors.primary} />
        </Pressable>
      </View>
      <Text style={[styles.body, { color: colors.text }]}>{body}</Text>
      <Pressable
        onPress={handleDismiss}
        style={({ pressed }) => [
          styles.gotItButton,
          { borderColor: colors.primary },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={[styles.gotItText, { color: colors.primary }]}>Got it</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyLg,
    fontWeight: "700",
    flex: 1,
  },
  body: {
    ...typography.body,
    lineHeight: 20,
  },
  gotItButton: {
    alignSelf: "flex-end",
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  gotItText: {
    ...typography.caption,
    fontWeight: "700",
  },
});
