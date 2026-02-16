import { useSettings } from "../contexts/SettingsContext";
import { lightColors, darkColors, ColorPalette } from "./colors";

export function useThemeColors(): ColorPalette {
  const { theme } = useSettings();
  return theme === "dark" ? darkColors : lightColors;
}
