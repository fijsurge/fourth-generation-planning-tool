import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { getSettings, setSetting } from "../api/googleSheets";
import { ThemeMode } from "../theme/colors";

interface SettingsState {
  defaultAttendees: string;
  setDefaultAttendees: (value: string) => Promise<void>;
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsState | null>(null);

const SETTINGS_KEY_DEFAULT_ATTENDEES = "defaultAttendees";
const SETTINGS_KEY_THEME = "theme";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { getValidAccessToken, isLoggedIn } = useAuth();
  const [defaultAttendees, setDefaultAttendeesState] = useState("");
  const [theme, setThemeState] = useState<ThemeMode>("light");
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

  return (
    <SettingsContext.Provider
      value={{ defaultAttendees, setDefaultAttendees, theme, setTheme, isLoading }}
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
