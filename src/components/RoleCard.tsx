import { useMemo } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Role } from "../models/Role";
import { useThemeColors } from "../theme/useThemeColors";
import { spacing, borderRadius } from "../theme/spacing";
import { typography } from "../theme/typography";
import { elevation } from "../theme/elevation";

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
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...elevation.sm,
      shadowColor: colors.shadow,
    },
    content: {
      flex: 1,
    },
    name: {
      ...typography.bodyLg,
      color: colors.text,
    },
    description: {
      ...typography.bodySm,
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
