import { View, Pressable, Text, StyleSheet } from "react-native";
import { GCAL_COLORS } from "../utils/calendarColors";

const COLOR_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
const CIRCLE_SIZE = 28;
const GAP = 6;

interface ColorPickerProps {
  value: string | undefined;
  onChange: (colorId: string | undefined) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View style={styles.row}>
      {COLOR_IDS.map((id) => {
        const { hex } = GCAL_COLORS[id];
        const selected = value === id;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(selected ? undefined : id)}
            style={[styles.circle, { backgroundColor: hex }]}
          >
            {selected && <Text style={styles.check}>✓</Text>}
          </Pressable>
        );
      })}
      {/* "None" circle */}
      <Pressable
        onPress={() => onChange(undefined)}
        style={[styles.circle, styles.noneCircle]}
      >
        {!value && <Text style={styles.noneX}>✕</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    marginTop: 4,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  check: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  noneCircle: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#999",
  },
  noneX: {
    color: "#999",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
});
