import { View, Text, StyleSheet } from "react-native";

export default function QuadrantScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quadrant Matrix</Text>
      <Text style={styles.placeholder}>
        2x2 Covey matrix will appear here (Phase 4)
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
