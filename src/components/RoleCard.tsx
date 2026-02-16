import { useMemo } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Role } from "../models/Role";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";

interface RoleCardProps {
  role: Role;
  onPress: () => void;
}

export function RoleCard({ role, onPress }: RoleCardProps) {
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    content: {
      flex: 1,
    },
    name: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
  }), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.content}>
        <Text style={styles.name}>{role.name}</Text>
        {role.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {role.description}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}
