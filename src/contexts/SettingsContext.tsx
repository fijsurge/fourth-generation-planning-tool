import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { getSettings, setSetting } from "../api/googleSheets";

interface SettingsState {
  defaultAttendees: string;
  setDefaultAttendees: (value: string) => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsState | null>(null);

const SETTINGS_KEY_DEFAULT_ATTENDEES = "defaultAttendees";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { getValidAccessToken, isLoggedIn } = useAuth();
  const [defaultAttendees, setDefaultAttendeesState] = useState("");
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

  return (
    <SettingsContext.Provider
      value={{ defaultAttendees, setDefaultAttendees, isLoading }}
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
