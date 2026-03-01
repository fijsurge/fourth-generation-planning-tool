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
  missionStatement: string;
  setMissionStatement: (value: string) => Promise<void>;
  shouldShowMissionStatement: boolean;
  dismissMissionStatement: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsState | null>(null);

const SETTINGS_KEY_DEFAULT_ATTENDEES = "defaultAttendees";
const SETTINGS_KEY_THEME = "theme";
const SETTINGS_KEY_NOTIFICATIONS_ENABLED = "notificationsEnabled";
const SETTINGS_KEY_NOTIFICATION_TIME = "notificationTime";
const SETTINGS_KEY_MISSION_STATEMENT = "missionStatement";

const MISSION_DISMISSED_STORAGE_KEY = "missionDismissedWeek";

// Module-level fallback for non-web platforms (resets per session)
let _sessionDismissedWeek = "";

function getCurrentWeekKey(): string {
  const now = new Date();
  const week = String(getISOWeek(now)).padStart(2, "0");
  return `${getISOWeekYear(now)}-W${week}`;
}

function readDismissedWeek(): string {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    return localStorage.getItem(MISSION_DISMISSED_STORAGE_KEY) ?? "";
  }
  return _sessionDismissedWeek;
}

function writeDismissedWeek(weekKey: string): void {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    localStorage.setItem(MISSION_DISMISSED_STORAGE_KEY, weekKey);
  } else {
    _sessionDismissedWeek = weekKey;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { getValidAccessToken, isLoggedIn } = useAuth();
  const [defaultAttendees, setDefaultAttendeesState] = useState("");
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [notificationTime, setNotificationTimeState] = useState("09:00");
  const [missionStatement, setMissionStatementState] = useState("");
  const [dismissedWeek, setDismissedWeekState] = useState<string>(readDismissedWeek);
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
      const missionEntry = entries.find((e) => e.key === SETTINGS_KEY_MISSION_STATEMENT);
      if (missionEntry?.value) setMissionStatementState(missionEntry.value);
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
      setMissionStatementState("");
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
    return dismissedWeek !== getCurrentWeekKey();
  }, [missionStatement, dismissedWeek]);

  const dismissMissionStatement = useCallback(() => {
    const weekKey = getCurrentWeekKey();
    writeDismissedWeek(weekKey);
    setDismissedWeekState(weekKey);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        defaultAttendees, setDefaultAttendees,
        theme, setTheme,
        notificationsEnabled, setNotificationsEnabled,
        notificationTime, setNotificationTime,
        missionStatement, setMissionStatement,
        shouldShowMissionStatement, dismissMissionStatement,
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
