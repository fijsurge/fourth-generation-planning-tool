import { useState, useMemo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator, Switch, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useAuth } from "../../src/auth/AuthContext";
import { useRoles } from "../../src/hooks/useRoles";
import { useSettings } from "../../src/contexts/SettingsContext";
import { RoleCard } from "../../src/components/RoleCard";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { ThemeMode } from "../../src/theme/colors";
import { spacing, borderRadius } from "../../src/theme/spacing";
import { requestPermission, cancelAllScheduled } from "../../src/notifications/scheduler";

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { logout } = useAuth();
  const { roles, isLoading } = useRoles();
  const { defaultAttendees, setDefaultAttendees, theme, setTheme, notificationsEnabled, setNotificationsEnabled, notificationTime, setNotificationTime } = useSettings();
  const activeRoles = roles.filter((r) => r.active);
  const inactiveRoles = roles.filter((r) => !r.active);
  const [inactiveExpanded, setInactiveExpanded] = useState(false);
  const [attendeesInput, setAttendeesInput] = useState<string | null>(null);
  const [savingAttendees, setSavingAttendees] = useState(false);
  const [notifTimeInput, setNotifTimeInput] = useState<string | null>(null);
  const [savingNotifTime, setSavingNotifTime] = useState(false);

  const attendeesValue = attendeesInput !== null ? attendeesInput : defaultAttendees;

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestPermission();
      if (!granted) return;
    } else {
      await cancelAllScheduled();
    }
    await setNotificationsEnabled(value);
  };

  const handleSaveNotifTime = async () => {
    if (notifTimeInput === null) return;
    setSavingNotifTime(true);
    try {
      await setNotificationTime(notifTimeInput.trim());
      setNotifTimeInput(null);
    } catch {
      // keep local state so user can retry
    } finally {
      setSavingNotifTime(false);
    }
  };

  const handleSaveAttendees = async () => {
    if (attendeesInput === null) return;
    setSavingAttendees(true);
    try {
      await setDefaultAttendees(attendeesInput.trim());
      setAttendeesInput(null);
    } catch {
      // keep local state so user can retry
    } finally {
      setSavingAttendees(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
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
    fieldLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    fieldHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: "center",
      alignSelf: "flex-start",
      marginTop: spacing.sm,
    },
    saveButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.lg,
    },
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: "center",
      borderRadius: borderRadius.sm,
    },
    segmentButtonActive: {
      backgroundColor: colors.primary,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: colors.onPrimary,
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
      color: colors.danger,
      fontWeight: "600",
    },
    versionText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.xl,
      paddingBottom: spacing.md,
    },
  }), [colors]);

  const THEME_OPTIONS: { label: string; value: ThemeMode }[] = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator>
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

      <Text style={styles.sectionTitle}>Theme</Text>
      <View style={styles.segmentedControl}>
        {THEME_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setTheme(opt.value)}
            style={[
              styles.segmentButton,
              theme === opt.value && styles.segmentButtonActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                theme === opt.value && styles.segmentTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Calendar</Text>
      <Text style={styles.fieldLabel}>Default Attendees</Text>
      <Text style={styles.fieldHint}>
        Comma-separated emails pre-filled when creating events
      </Text>
      <TextInput
        style={styles.input}
        value={attendeesValue}
        onChangeText={setAttendeesInput}
        placeholder="e.g. work@example.com, personal@example.com"
        placeholderTextColor={colors.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {attendeesInput !== null && attendeesInput.trim() !== defaultAttendees && (
        <Pressable
          onPress={handleSaveAttendees}
          disabled={savingAttendees}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          {savingAttendees ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </Pressable>
      )}

      {Platform.OS !== "web" && (
        <>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
            <View>
              <Text style={styles.fieldLabel}>Q2 Goal Reminders</Text>
              <Text style={styles.fieldHint}>Weekly reminder for important goals</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ true: colors.primary }}
            />
          </View>
          {notificationsEnabled && (
            <>
              <Text style={styles.fieldLabel}>Reminder time (HH:mm)</Text>
              <TextInput
                style={styles.input}
                value={notifTimeInput !== null ? notifTimeInput : notificationTime}
                onChangeText={setNotifTimeInput}
                placeholder="09:00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
              {notifTimeInput !== null && notifTimeInput.trim() !== notificationTime && (
                <Pressable
                  onPress={handleSaveNotifTime}
                  disabled={savingNotifTime}
                  style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.8 }]}
                >
                  {savingNotifTime ? (
                    <ActivityIndicator color={colors.onPrimary} size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </Pressable>
              )}
            </>
          )}
        </>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Account</Text>
      <Pressable
        onPress={logout}
        style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.8 }]}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      <Text style={styles.versionText}>
        Version {Constants.expoConfig?.version ?? "—"}
      </Text>
    </ScrollView>
  );
}
