import { Modal, View, Text, Image, Pressable, StyleSheet, ScrollView } from "react-native";
import { useSettings } from "../contexts/SettingsContext";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";

const logo = require("../../assets/fourth_gen_v1_black_fg_trans_bg.png");

export function MissionStatementModal() {
  const colors = useThemeColors();
  const { theme, missionStatement, shouldShowMissionStatement, dismissMissionStatement } = useSettings();
  const logoTint = theme === "dark" ? "#FFFFFF" : "#000000";

  return (
    <Modal
      visible={shouldShowMissionStatement}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image
            source={logo}
            style={[styles.logo, { tintColor: logoTint }]}
            resizeMode="contain"
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>
            MY MISSION STATEMENT
          </Text>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.statement, { color: colors.text }]}>
              {missionStatement}
            </Text>
          </ScrollView>

          <Pressable
            onPress={dismissMissionStatement}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
              Got it — dismiss for this week
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
    padding: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logo: {
    width: 64,
    height: 64,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  scrollArea: {
    maxHeight: 300,
    width: "100%",
  },
  scrollContent: {
    paddingVertical: spacing.sm,
  },
  statement: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    fontStyle: "italic",
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
