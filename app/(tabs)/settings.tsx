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
import { SpotlightCallout } from "../../src/components/onboarding/SpotlightCallout";

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { logout } = useAuth();
  const { roles, isLoading } = useRoles();
  const {
    defaultAttendees, setDefaultAttendees,
    theme, setTheme,
    notificationsEnabled, setNotificationsEnabled,
    notificationTime, setNotificationTime,
    closeoutReminderEnabled, setCloseoutReminderEnabled,
    closeoutReminderDay, setCloseoutReminderDay,
    closeoutReminderTime, setCloseoutReminderTime,
    missionStatement, setMissionStatement,
    openOnboarding,
    resetAllSpotlights,
  } = useSettings();
  const activeRoles = roles.filter((r) => r.active);
  const inactiveRoles = roles.filter((r) => !r.active);
  const [inactiveExpanded, setInactiveExpanded] = useState(false);
  const [attendeesInput, setAttendeesInput] = useState<string | null>(null);
  const [savingAttendees, setSavingAttendees] = useState(false);
  const [notifTimeInput, setNotifTimeInput] = useState<string | null>(null);
  const [savingNotifTime, setSavingNotifTime] = useState(false);
  const [closeoutTimeInput, setCloseoutTimeInput] = useState<string | null>(null);
  const [savingCloseoutTime, setSavingCloseoutTime] = useState(false);
  const [missionInput, setMissionInput] = useState<string | null>(null);
  const [savingMission, setSavingMission] = useState(false);

  const attendeesValue = attendeesInput !== null ? attendeesInput : defaultAttendees;
  const missionValue = missionInput !== null ? missionInput : missionStatement;

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

  const handleSaveCloseoutTime = async () => {
    if (closeoutTimeInput === null) return;
    setSavingCloseoutTime(true);
    try {
      await setCloseoutReminderTime(closeoutTimeInput.trim());
      setCloseoutTimeInput(null);
    } catch {
      // keep local state so user can retry
    } finally {
      setSavingCloseoutTime(false);
    }
  };

  const handleSaveMission = async () => {
    if (missionInput === null) return;
    setSavingMission(true);
    try {
      await setMissionStatement(missionInput.trim());
      setMissionInput(null);
    } catch {
      // keep local state so user can retry
    } finally {
      setSavingMission(false);
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
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    chipTextSelected: {
      color: colors.onPrimary,
      fontWeight: "600",
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
    multilineInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.surface,
      minHeight: 120,
      textAlignVertical: "top",
    },
    previewTourRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.md,
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

      <Text style={styles.sectionTitle}>Mission Statement</Text>
      <Text style={styles.fieldHint}>
        Your personal mission statement — shown as a reminder at least once a week
      </Text>
      <TextInput
        style={styles.multilineInput}
        value={missionValue}
        onChangeText={setMissionInput}
        placeholder="Write your personal mission statement here..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={5}
      />
      {missionInput !== null && missionInput.trim() !== missionStatement && (
        <Pressable
          onPress={handleSaveMission}
          disabled={savingMission}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { opacity: 0.8 },
          ]}
        >
          {savingMission ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </Pressable>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Help</Text>
      <Pressable
        onPress={() => openOnboarding({ preview: true })}
        style={({ pressed }) => [
          styles.previewTourRow,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Preview the welcome tour</Text>
          <Text style={styles.fieldHint}>
            Walk through the 5-step intro without changing your data
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
      <Pressable
        onPress={() => resetAllSpotlights().catch(() => {})}
        style={({ pressed }) => [
          styles.previewTourRow,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Reset feature hints</Text>
          <Text style={styles.fieldHint}>
            Show the small "did you know?" callouts again as you re-discover features
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Calendar</Text>
      <SpotlightCallout
        name="calendar-invitees"
        title="Auto-invite people to your goals"
        body="Add emails here once and every calendar event you create from a goal will pre-fill these attendees. Handy for joint planning with a partner or accountability buddy."
      />
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

          {/* Daily goal reminder */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
            <View>
              <Text style={styles.fieldLabel}>Daily Goal Reminder</Text>
              <Text style={styles.fieldHint}>Daily reminder for Q1 &amp; Q2 goals</Text>
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

          {/* Weekly closeout reminder */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.md, marginBottom: spacing.sm }}>
            <View>
              <Text style={styles.fieldLabel}>Weekly Closeout Reminder</Text>
              <Text style={styles.fieldHint}>Nudge to reflect and close out the week</Text>
            </View>
            <Switch
              value={closeoutReminderEnabled}
              onValueChange={setCloseoutReminderEnabled}
              trackColor={{ true: colors.primary }}
            />
          </View>
          {closeoutReminderEnabled && (
            <>
              <Text style={styles.fieldLabel}>Day</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm }}>
                {[
                  { label: "Sun", value: 1 },
                  { label: "Mon", value: 2 },
                  { label: "Tue", value: 3 },
                  { label: "Wed", value: 4 },
                  { label: "Thu", value: 5 },
                  { label: "Fri", value: 6 },
                  { label: "Sat", value: 7 },
                ].map(({ label, value }) => (
                  <Pressable
                    key={value}
                    onPress={() => setCloseoutReminderDay(value)}
                    style={[
                      styles.chip,
                      closeoutReminderDay === value && styles.chipSelected,
                    ]}
                  >
                    <Text style={[
                      styles.chipText,
                      closeoutReminderDay === value && styles.chipTextSelected,
                    ]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Time (HH:mm)</Text>
              <TextInput
                style={styles.input}
                value={closeoutTimeInput !== null ? closeoutTimeInput : closeoutReminderTime}
                onChangeText={setCloseoutTimeInput}
                placeholder="18:00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
              {closeoutTimeInput !== null && closeoutTimeInput.trim() !== closeoutReminderTime && (
                <Pressable
                  onPress={handleSaveCloseoutTime}
                  disabled={savingCloseoutTime}
                  style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.8 }]}
                >
                  {savingCloseoutTime ? (
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
