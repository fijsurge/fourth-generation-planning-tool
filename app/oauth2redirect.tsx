import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../src/auth/AuthContext";
import { useThemeColors } from "../src/theme/useThemeColors";

// Signal to expo-auth-session that the OAuth redirect has been received.
// This must run at module load time, before the component renders.
WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirectScreen() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/(tabs)/weekly-plan");
    } else {
      // Auth is still in progress — token exchange fires in AuthContext.
      // Stay here; the next render when isLoggedIn flips will redirect.
    }
  }, [isLoggedIn]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
