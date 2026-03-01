import { Redirect } from "expo-router";
import { View, Image, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { useThemeColors } from "../src/theme/useThemeColors";
import { useSettings } from "../src/contexts/SettingsContext";

const logo = require("../assets/fourth_gen_v1_black_fg_trans_bg.png");

export default function Index() {
  const colors = useThemeColors();
  const { theme } = useSettings();
  const { isLoading, isLoggedIn } = useAuth();
  const logoTint = theme === "dark" ? "#FFFFFF" : "#000000";

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Image
          source={logo}
          style={[styles.logo, { tintColor: logoTint }]}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>
          Fourth Gen Planner
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Weekly planning based on Covey's 7 Habits
        </Text>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/weekly-plan" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 180,
    height: 180,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  loader: {
    marginTop: 32,
  },
});
