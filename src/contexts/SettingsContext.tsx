import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Platform } from "react-native";
import { getISOWeek, getISOWeekYear } from "date-fns";
import { useAuth } from "../auth/AuthContext";
import { getSettings, setSetting } from "../api/googleSheets";
import { ThemeMode } from "../theme/colors";

interface SettingsState {
  defaultAttendees: string;
  setDefaultAttendees: (value: string) => Promise<void>;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => Promise<void>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => Promise<void>;
  notificationTime: string;
  setNotificationTime: (value: string) => Promise<void>;
  closeoutReminderEnabled: boolean;
  setCloseoutReminderEnabled: (value: boolean) => Promise<void>;
  closeoutReminderDay: number; // 1=Sun, 2=Mon, ... 7=Sat
  setCloseoutReminderDay: (value: number) => Promise<void>;
  closeoutReminderTime: string; // HH:mm
  setCloseoutReminderTime: (value: string) => Promise<void>;
  missionStatement: string;
  setMissionStatement: (value: string) => Promise<void>;
  shouldShowMissionStatement: boolean;
  dismissMissionStatement: () => void;      // dismiss for the rest of the week
  skipMissionStatement: () => void;         // skip for ~48h, may show again this week
  // Onboarding walkthrough
  onboardingCompletedAt: string | null;     // ISO timestamp; null = not yet finished
  onboardingVersion: number;                // version she completed; 0 = none
  shouldAutoLaunchOnboarding: boolean;      // true = immersive launch this session
  shouldShowOnboardingBanner: boolean;      // true = persistent CTA in the app shell
  onboardingModalOpen: boolean;             // controls WalkthroughModal visibility
  onboardingPreviewMode: boolean;           // true = ephemeral (no sheet writes)
  openOnboarding: (opts?: { preview?: boolean }) => void;
  closeOnboarding: () => void;
  completeOnboarding: () => Promise<void>;
  markOnboardingAutoLaunched: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsState | null>(null);

const SETTINGS_KEY_DEFAULT_ATTENDEES = "defaultAttendees";
const SETTINGS_KEY_THEME = "theme";
const SETTINGS_KEY_NOTIFICATIONS_ENABLED = "notificationsEnabled";
const SETTINGS_KEY_NOTIFICATION_TIME = "notificationTime";
const SETTINGS_KEY_CLOSEOUT_REMINDER_ENABLED = "closeoutReminderEnabled";
const SETTINGS_KEY_CLOSEOUT_REMINDER_DAY = "closeoutReminderDay";
const SETTINGS_KEY_CLOSEOUT_REMINDER_TIME = "closeoutReminderTime";
const SETTINGS_KEY_MISSION_STATEMENT = "missionStatement";
const SETTINGS_KEY_ONBOARDING_COMPLETED_AT = "onboardingCompletedAt";
const SETTINGS_KEY_ONBOARDING_VERSION = "onboardingVersion";

// Bump to re-prompt users who completed a previous flow.
export const CURRENT_ONBOARDING_VERSION = 1;

const MISSION_DISMISSED_KEY   = "missionDismissedWeek";
const MISSION_SKIP_UNTIL_KEY  = "missionSkipUntil";      // ISO timestamp
const MISSION_SCHEDULED_KEY   = "missionScheduledFor";   // "<weekKey>|<ISO timestamp>"
const ONBOARDING_AUTO_LAUNCHED_KEY = "onboardingAutoLaunched"; // local-only flag

// Module-level fallbacks for non-web platforms (reset per session)
let _sessionDismissedWeek = "";
let _sessionSkipUntil = "";
let _sessionScheduled = "";
let _sessionOnboardingAutoLaunched = "";

function getCurrentWeekKey(): string {
  const now = new Date();
  const week = String(getISOWeek(now)).padStart(2, "0");
  return `${getISOWeekYear(now)}-W${week}`;
}

function storageGet(key: string, sessionFallback: string): string {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    return localStorage.getItem(key) ?? "";
  }
  return sessionFallback;
}

function storageSet(key: string, value: string, setter: (v: string) => void): void {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
  }
  setter(value);
}

function readDismissedWeek(): string { return storageGet(MISSION_DISMISSED_KEY, _sessionDismissedWeek); }
function writeDismissedWeek(v: string) { storageSet(MISSION_DISMISSED_KEY, v, (s) => { _sessionDismissedWeek = s; }); }

function readSkipUntil(): string { return storageGet(MISSION_SKIP_UNTIL_KEY, _sessionSkipUntil); }
function writeSkipUntil(v: string) { storageSet(MISSION_SKIP_UNTIL_KEY, v, (s) => { _sessionSkipUntil = s; }); }

function readScheduled(): string { return storageGet(MISSION_SCHEDULED_KEY, _sessionScheduled); }
function writeScheduled(v: string) { storageSet(MISSION_SCHEDULED_KEY, v, (s) => { _sessionScheduled = s; }); }

function readOnboardingAutoLaunched(): string {
  return storageGet(ONBOARDING_AUTO_LAUNCHED_KEY, _sessionOnboardingAutoLaunched);
}
function writeOnboardingAutoLaunched(v: string) {
  storageSet(ONBOARDING_AUTO_LAUNCHED_KEY, v, (s) => { _sessionOnboardingAutoLaunched = s; });
}

/** Pick a random ISO timestamp between now and end of current ISO week (Sunday 23:59). */
function generateScheduledTime(weekKey: string): string {
  const now = new Date();
  // End of week = next Monday 00:00 minus 1 ms
  const endOfWeek = new Date(now);
  // ISO week ends Sunday; advance to next Mon then subtract
  const dayOfWeek = endOfWeek.getDay(); // 0=Sun … 6=Sat
  const daysUntilMon = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  endOfWeek.setDate(endOfWeek.getDate() + daysUntilMon);
  endOfWeek.setHours(0, 0, 0, -1);

  const nowMs = now.getTime();
  const endMs = endOfWeek.getTime();
  const scheduledMs = nowMs + Math.random() * (endMs - nowMs);
  return `${weekKey}|${new Date(scheduledMs).toISOString()}`;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { getValidAccessToken, isLoggedIn } = useAuth();
  const [defaultAttendees, setDefaultAttendeesState] = useState("");
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [notificationTime, setNotificationTimeState] = useState("09:00");
  const [closeoutReminderEnabled, setCloseoutReminderEnabledState] = useState(false);
  const [closeoutReminderDay, setCloseoutReminderDayState] = useState(1); // Sunday
  const [closeoutReminderTime, setCloseoutReminderTimeState] = useState("18:00");
  const [missionStatement, setMissionStatementState] = useState("");
  const [dismissedWeek, setDismissedWeekState] = useState<string>(readDismissedWeek);
  const [skipUntil, setSkipUntilState] = useState<string>(readSkipUntil);
  const [scheduledFor, setScheduledForState] = useState<string>(() => {
    const stored = readScheduled();
    const weekKey = getCurrentWeekKey();
    // If stored value is for this week, use it; otherwise generate a new one
    if (stored.startsWith(weekKey + "|")) return stored;
    const generated = generateScheduledTime(weekKey);
    writeScheduled(generated);
    return generated;
  });
  const [onboardingCompletedAt, setOnboardingCompletedAtState] = useState<string | null>(null);
  const [onboardingVersion, setOnboardingVersionState] = useState<number>(0);
  const [autoLaunchedFlag, setAutoLaunchedFlagState] = useState<string>(readOnboardingAutoLaunched);
  const [onboardingModalOpen, setOnboardingModalOpenState] = useState<boolean>(false);
  const [onboardingPreviewMode, setOnboardingPreviewModeState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getValidAccessToken();
      const entries = await getSettings(token);
      const attendeesEntry = entries.find(
        (e) => e.key === SETTINGS_KEY_DEFAULT_ATTENDEES
      );
      setDefaultAttendeesState(attendeesEntry?.value || "");
      const themeEntry = entries.find((e) => e.key === SETTINGS_KEY_THEME);
      if (themeEntry?.value === "dark") {
        setThemeState("dark");
      }
      const notifEnabled = entries.find((e) => e.key === SETTINGS_KEY_NOTIFICATIONS_ENABLED);
      if (notifEnabled?.value === "true") setNotificationsEnabledState(true);
      const notifTime = entries.find((e) => e.key === SETTINGS_KEY_NOTIFICATION_TIME);
      if (notifTime?.value) setNotificationTimeState(notifTime.value);
      const closeoutEnabled = entries.find((e) => e.key === SETTINGS_KEY_CLOSEOUT_REMINDER_ENABLED);
      if (closeoutEnabled?.value === "true") setCloseoutReminderEnabledState(true);
      const closeoutDay = entries.find((e) => e.key === SETTINGS_KEY_CLOSEOUT_REMINDER_DAY);
      if (closeoutDay?.value) setCloseoutReminderDayState(parseInt(closeoutDay.value, 10));
      const closeoutTime = entries.find((e) => e.key === SETTINGS_KEY_CLOSEOUT_REMINDER_TIME);
      if (closeoutTime?.value) setCloseoutReminderTimeState(closeoutTime.value);
      const missionEntry = entries.find((e) => e.key === SETTINGS_KEY_MISSION_STATEMENT);
      if (missionEntry?.value) setMissionStatementState(missionEntry.value);
      const onboardingCompletedEntry = entries.find((e) => e.key === SETTINGS_KEY_ONBOARDING_COMPLETED_AT);
      if (onboardingCompletedEntry?.value) setOnboardingCompletedAtState(onboardingCompletedEntry.value);
      const onboardingVersionEntry = entries.find((e) => e.key === SETTINGS_KEY_ONBOARDING_VERSION);
      if (onboardingVersionEntry?.value) setOnboardingVersionState(parseInt(onboardingVersionEntry.value, 10) || 0);
    } catch {
      // Silently fail — settings are optional
    } finally {
      setIsLoading(false);
    }
  }, [getValidAccessToken]);

  useEffect(() => {
    if (isLoggedIn) {
      loadSettings();
    } else {
      setDefaultAttendeesState("");
      setThemeState("light");
      setNotificationsEnabledState(false);
      setNotificationTimeState("09:00");
      setCloseoutReminderEnabledState(false);
      setCloseoutReminderDayState(1);
      setCloseoutReminderTimeState("18:00");
      setMissionStatementState("");
      setOnboardingCompletedAtState(null);
      setOnboardingVersionState(0);
      setOnboardingModalOpenState(false);
      setOnboardingPreviewModeState(false);
      setIsLoading(false);
    }
  }, [isLoggedIn, loadSettings]);

  const setDefaultAttendees = useCallback(
    async (value: string) => {
      setDefaultAttendeesState(value);
      const token = await getValidAccessToken();
      await setSetting(token, SETTINGS_KEY_DEFAULT_ATTENDEES, value);
    },
    [getValidAccessToken]
  );

  const setTheme = useCallback(
    async (mode: ThemeMode) => {
      setThemeState(mode);
      try {
        const token = await getValidAccessToken();
        await setSetting(token, SETTINGS_KEY_THEME, mode);
      } catch {
        // Theme still changes locally even if persist fails
      }
    },
    [getValidAccessToken]
  );

  const setNotificationsEnabled = useCallback(
    async (value: boolean) => {
      setNotificationsEnabledState(value);
      try {
        const token = await getValidAccessToken();
        await setSetting(token, SETTINGS_KEY_NOTIFICATIONS_ENABLED, String(value));
      } catch {
        // Silent fail
      }
    },
    [getValidAccessToken]
  );

  const setNotificationTime = useCallback(
    async (value: string) => {
      setNotificationTimeState(value);
      try {
        const token = await getValidAccessToken();
        await setSetting(token, SETTINGS_KEY_NOTIFICATION_TIME, value);
      } catch {
        // Silent fail
      }
    },
    [getValidAccessToken]
  );

  const setCloseoutReminderEnabled = useCallback(
    async (value: boolean) => {
      setCloseoutReminderEnabledState(value);
      try {
        const token = await getValidAccessToken();
        await setSetting(token, SETTINGS_KEY_CLOSEOUT_REMINDER_ENABLED, String(value));
      } catch { /* silent fail */ }
    },
    [getValidAccessToken]
  );

  const setCloseoutReminderDay = useCallback(
    async (value: number) => {
      setCloseoutReminderDayState(value);
      try {
        const token = await getValidAccessToken();
        await setSetting(token, SETTINGS_KEY_CLOSEOUT_REMINDER_DAY, String(value));
      } catch { /* silent fail */ }
    },
    [getValidAccessToken]
  );

  const setCloseoutReminderTime = useCallback(
    async (value: string) => {
      setCloseoutReminderTimeState(value);
      try {
        const token = await getValidAccessToken();
        await setSetting(token, SETTINGS_KEY_CLOSEOUT_REMINDER_TIME, value);
      } catch { /* silent fail */ }
    },
    [getValidAccessToken]
  );

  const setMissionStatement = useCallback(
    async (value: string) => {
      setMissionStatementState(value);
      try {
        const token = await getValidAccessToken();
        await setSetting(token, SETTINGS_KEY_MISSION_STATEMENT, value);
      } catch {
        // Silent fail — mission statement still updates locally
      }
    },
    [getValidAccessToken]
  );

  const shouldShowMissionStatement = useMemo(() => {
    if (!missionStatement.trim()) return false;
    const weekKey = getCurrentWeekKey();
    if (dismissedWeek === weekKey) return false;
    // Check scheduled time: only show after the randomly-picked moment this week
    const scheduledTs = scheduledFor.startsWith(weekKey + "|")
      ? scheduledFor.split("|")[1]
      : null;
    if (scheduledTs && new Date(scheduledTs) > new Date()) return false;
    // Check skip-until
    if (skipUntil && new Date(skipUntil) > new Date()) return false;
    return true;
  }, [missionStatement, dismissedWeek, scheduledFor, skipUntil]);

  /** Dismiss for the rest of this week — won't show again until next week. */
  const dismissMissionStatement = useCallback(() => {
    const weekKey = getCurrentWeekKey();
    writeDismissedWeek(weekKey);
    setDismissedWeekState(weekKey);
  }, []);

  /** Skip for ~48 hours — may show again before the week ends. */
  const skipMissionStatement = useCallback(() => {
    const until = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    writeSkipUntil(until);
    setSkipUntilState(until);
  }, []);

  const markOnboardingAutoLaunched = useCallback(() => {
    writeOnboardingAutoLaunched("true");
    setAutoLaunchedFlagState("true");
  }, []);

  const openOnboarding = useCallback((opts?: { preview?: boolean }) => {
    setOnboardingPreviewModeState(!!opts?.preview);
    setOnboardingModalOpenState(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setOnboardingModalOpenState(false);
    setOnboardingPreviewModeState(false);
  }, []);

  const completeOnboarding = useCallback(async () => {
    const now = new Date().toISOString();
    setOnboardingCompletedAtState(now);
    setOnboardingVersionState(CURRENT_ONBOARDING_VERSION);
    setOnboardingModalOpenState(false);
    setOnboardingPreviewModeState(false);
    try {
      const token = await getValidAccessToken();
      await setSetting(token, SETTINGS_KEY_ONBOARDING_COMPLETED_AT, now);
      await setSetting(token, SETTINGS_KEY_ONBOARDING_VERSION, String(CURRENT_ONBOARDING_VERSION));
    } catch {
      // Silent fail — local state still reflects completion
    }
  }, [getValidAccessToken]);

  const shouldAutoLaunchOnboarding = useMemo(() => {
    if (isLoading) return false;
    if (onboardingCompletedAt) return false;
    if (autoLaunchedFlag === "true") return false;
    return true;
  }, [isLoading, onboardingCompletedAt, autoLaunchedFlag]);

  const shouldShowOnboardingBanner = useMemo(() => {
    if (isLoading) return false;
    if (onboardingCompletedAt) return false;
    if (onboardingModalOpen) return false;       // hide banner while modal is up
    if (autoLaunchedFlag !== "true") return false; // before auto-launch fires, no banner
    return true;
  }, [isLoading, onboardingCompletedAt, onboardingModalOpen, autoLaunchedFlag]);

  return (
    <SettingsContext.Provider
      value={{
        defaultAttendees, setDefaultAttendees,
        theme, setTheme,
        notificationsEnabled, setNotificationsEnabled,
        notificationTime, setNotificationTime,
        closeoutReminderEnabled, setCloseoutReminderEnabled,
        closeoutReminderDay, setCloseoutReminderDay,
        closeoutReminderTime, setCloseoutReminderTime,
        missionStatement, setMissionStatement,
        shouldShowMissionStatement, dismissMissionStatement, skipMissionStatement,
        onboardingCompletedAt, onboardingVersion,
        shouldAutoLaunchOnboarding, shouldShowOnboardingBanner,
        onboardingModalOpen, onboardingPreviewMode,
        openOnboarding, closeOnboarding, completeOnboarding, markOnboardingAutoLaunched,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
