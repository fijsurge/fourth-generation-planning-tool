import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/auth/AuthContext";
import { useRoles } from "../../src/hooks/useRoles";
import { RoleCard } from "../../src/components/RoleCard";
import { colors } from "../../src/theme/colors";
import { spacing, borderRadius } from "../../src/theme/spacing";

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { roles, isLoading } = useRoles();
  const activeRoles = roles.filter((r) => r.active);
  const inactiveRoles = roles.filter((r) => !r.active);
  const [inactiveExpanded, setInactiveExpanded] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Roles</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.roleList}>
          {activeRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onPress={() => router.push(`/role/${role.id}`)}
            />
          ))}
          {activeRoles.length === 0 && (
            <Text style={styles.emptyText}>No roles yet. Add one to get started.</Text>
          )}
        </View>
      )}

      <Pressable
        onPress={() => router.push("/role/new")}
        style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addButtonText}>Add Role</Text>
      </Pressable>

      {inactiveRoles.length > 0 && (
        <View style={styles.inactiveSection}>
          <Pressable
            onPress={() => setInactiveExpanded((prev) => !prev)}
            style={styles.inactiveHeader}
          >
            <Text style={styles.inactiveHeaderText}>
              Inactive Roles ({inactiveRoles.length})
            </Text>
            <Ionicons
              name={inactiveExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
          {inactiveExpanded && (
            <View style={styles.roleList}>
              {inactiveRoles.map((role) => (
                <Pressable
                  key={role.id}
                  onPress={() => router.push(`/role/${role.id}`)}
                  style={{ opacity: 0.5 }}
                >
                  <RoleCard role={role} onPress={() => router.push(`/role/${role.id}`)} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Account</Text>
      <Pressable
        onPress={logout}
        style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.8 }]}
      >
        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  roleList: {
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
  loader: {
    paddingVertical: spacing.lg,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  addButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  inactiveSection: {
    marginTop: spacing.md,
  },
  inactiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  inactiveHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutText: {
    fontSize: 16,
    color: "#dc2626",
    fontWeight: "600",
  },
});
