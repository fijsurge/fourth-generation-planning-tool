import { View, Text, StyleSheet } from "react-native";

export default function NewGoalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Goal</Text>
      <Text style={styles.placeholder}>
        Goal creation form will appear here (Phase 3)
      </Text>
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  placeholder: {
    fontSize: 14,
    color: "#999",
  },
});
