import { View, Text, StyleSheet } from "react-native";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fourth Gen Planner</Text>
      <Text style={styles.subtitle}>
        Weekly planning based on Covey's 7 Habits
      </Text>
      {/* TODO: Google Sign-In button (Phase 2) */}
      <Text style={styles.placeholder}>Sign in with Google (coming in Phase 2)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 48,
    textAlign: "center",
  },
  placeholder: {
    fontSize: 14,
    color: "#999",
    marginTop: 24,
  },
});
