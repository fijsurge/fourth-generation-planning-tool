import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Sign In" }} />
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
      </Stack>
    </>
  );
}
