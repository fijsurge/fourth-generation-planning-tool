import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/auth/AuthContext";
import { RolesProvider } from "../src/contexts/RolesContext";
import { CalendarEventsProvider } from "../src/contexts/CalendarEventsContext";
import { SettingsProvider } from "../src/contexts/SettingsContext";
import { useThemeColors } from "../src/theme/useThemeColors";
import { useSettings } from "../src/contexts/SettingsContext";

function InnerLayout() {
  const colors = useThemeColors();
  const { theme } = useSettings();

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const style = document.createElement("style");
    style.textContent = `
      * {
        scrollbar-width: thin;
        scrollbar-color: ${colors.scrollbarThumb} transparent;
      }
      *::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      *::-webkit-scrollbar-track {
        background: transparent;
      }
      *::-webkit-scrollbar-thumb {
        background: ${colors.scrollbarThumb};
        border-radius: 4px;
      }
      *::-webkit-scrollbar-thumb:hover {
        background: ${colors.scrollbarThumbHover};
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, [colors]);

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "auto"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Sign In", headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="goal/new"
          options={{ title: "New Goal", presentation: "modal" }}
        />
        <Stack.Screen
          name="goal/[id]"
          options={{ title: "Edit Goal", presentation: "modal" }}
        />
        <Stack.Screen
          name="role/new"
          options={{ title: "New Role", presentation: "modal" }}
        />
        <Stack.Screen
          name="role/[id]"
          options={{ title: "Edit Role", presentation: "modal" }}
        />
        <Stack.Screen
          name="event/new"
          options={{ title: "New Event", presentation: "modal" }}
        />
        <Stack.Screen
          name="event/[id]"
          options={{ title: "Edit Event", presentation: "modal" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
      <RolesProvider>
      <CalendarEventsProvider>
      <InnerLayout />
      </CalendarEventsProvider>
      </RolesProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
