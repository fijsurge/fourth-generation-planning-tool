import { Redirect } from "expo-router";

export default function Index() {
  // TODO: Check auth state and redirect accordingly
  const isLoggedIn = false;

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/weekly-plan" />;
  }

  return <Redirect href="/login" />;
}
