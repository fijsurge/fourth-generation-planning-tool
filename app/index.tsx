import { Redirect } from "expo-router";
import { View, Image, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { useThemeColors } from "../src/theme/useThemeColors";

const logo = require("../assets/splash-icon.png");

const SPLASH_BG = "#080C22";

export default function Index() {
  const colors = useThemeColors();
  const { isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: SPLASH_BG }]}>
        <Image
          source={logo}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: "#E8ECF8" }]}>
          Fourth Gen Planner
        </Text>
        <Text style={[styles.subtitle, { color: "rgba(232,236,248,0.55)" }]}>
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
