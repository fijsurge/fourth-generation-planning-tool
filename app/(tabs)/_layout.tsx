import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { MissionStatementModal } from "../../src/components/MissionStatementModal";
import { WalkthroughModal } from "../../src/components/onboarding/WalkthroughModal";
import { OnboardingBanner } from "../../src/components/onboarding/OnboardingBanner";
import { Logo } from "../../src/components/Logo";

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <View style={{ flex: 1 }}>
      <MissionStatementModal />
      <WalkthroughModal />
      <OnboardingBanner />
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
          <View style={{ marginLeft: 16 }}>
            <Logo size={28} />
          </View>
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
