import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/auth/AuthContext";
import { RolesProvider } from "../src/contexts/RolesContext";
import { CalendarEventsProvider } from "../src/contexts/CalendarEventsContext";
import { SettingsProvider } from "../src/contexts/SettingsContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
      <RolesProvider>
      <CalendarEventsProvider>
      <StatusBar style="auto" />
      <Stack>
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
      </CalendarEventsProvider>
      </RolesProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
