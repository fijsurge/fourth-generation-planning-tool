import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/auth/AuthContext";
import { colors } from "../src/theme/colors";
import { spacing } from "../src/theme/spacing";

export default function LoginScreen() {
  const { isLoggedIn, isLoading, login } = useAuth();

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/weekly-plan" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Fourth Gen Planner</Text>
        <Text style={styles.subtitle}>
          Weekly planning based on Covey's 7 Habits
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.signInButton,
            pressed && styles.signInButtonPressed,
          ]}
          onPress={login}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signInText}>Sign in with Google</Text>
          )}
        </Pressable>

        <Text style={styles.hint}>
          Signs in with your Google account to store data in Google Sheets
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
    textAlign: "center",
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  signInButtonPressed: {
    opacity: 0.85,
  },
  signInText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
