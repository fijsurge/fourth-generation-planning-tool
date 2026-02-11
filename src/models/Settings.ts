export interface SettingsEntry {
  key: string;
  value: string;
  updatedAt: string;
}

export interface AppSettings {
  weekStartDay: number; // 0 = Sunday, 1 = Monday
}

export const DEFAULT_SETTINGS: AppSettings = {
  weekStartDay: 1, // Monday
};
