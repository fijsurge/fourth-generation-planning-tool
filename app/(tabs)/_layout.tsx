import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { useSettings } from "../../src/contexts/SettingsContext";

const logo = require("../../assets/fourth_gen_v1_black_fg_trans_bg.png");

export default function TabLayout() {
  const colors = useThemeColors();
  const { theme } = useSettings();
  const logoTint = theme === "dark" ? "#FFFFFF" : "#000000";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerLeft: () => (
          <Image
            source={logo}
            style={{ width: 28, height: 28, marginLeft: 16, resizeMode: "contain", tintColor: logoTint }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="weekly-plan"
        options={{
          title: "Weekly Plan",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quadrant"
        options={{
          title: "Quadrant",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
