import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, View } from "react-native";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { MissionStatementModal } from "../../src/components/MissionStatementModal";

const logo = require("../../assets/adaptive-icon.png");

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <View style={{ flex: 1 }}>
      <MissionStatementModal />
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
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
            style={{ width: 28, height: 28, marginLeft: 16, resizeMode: "contain" }}
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
    </View>
  );
}
