import {
  makeRedirectUri,
  useAutoDiscovery,
  useAuthRequest,
  ResponseType,
} from "expo-auth-session";
import { Platform } from "react-native";

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;
const GOOGLE_WEB_CLIENT_SECRET = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET!;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID!;

// Android OAuth clients are validated by package name + SHA-1, not a client secret
const GOOGLE_CLIENT_ID =
  Platform.OS === "android" ? GOOGLE_ANDROID_CLIENT_ID : GOOGLE_WEB_CLIENT_ID;

export const GOOGLE_SCOPES = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/drive.file",
];

export function useGoogleAuthConfig() {
  const discovery = useAutoDiscovery("https://accounts.google.com");

  // Android OAuth clients require the reverse client-ID URI scheme.
  // e.g. "123-abc.apps.googleusercontent.com" → "com.googleusercontent.apps.123-abc:/oauth2redirect"
  const redirectUri =
    Platform.OS === "android"
      ? makeRedirectUri({
          native: `com.googleusercontent.apps.${GOOGLE_ANDROID_CLIENT_ID.replace(
            ".apps.googleusercontent.com",
            ""
          )}:/oauth2redirect`,
        })
      : makeRedirectUri({ scheme: "fourthgenplanner" });

  console.log("[Auth] Redirect URI:", redirectUri);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: GOOGLE_SCOPES,
      redirectUri,
      responseType: ResponseType.Code,
      usePKCE: true,
      extraParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
    discovery
  );

  return { request, response, promptAsync, discovery, redirectUri };
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const params: Record<string, string> = {
    client_id: GOOGLE_CLIENT_ID,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  };

  // Android OAuth clients don't use a client secret
  if (Platform.OS !== "android") {
    params.client_secret = GOOGLE_WEB_CLIENT_SECRET;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh an expired access token using a refresh token.
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const params: Record<string, string> = {
    client_id: GOOGLE_CLIENT_ID,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  };

  // Android OAuth clients don't use a client secret
  if (Platform.OS !== "android") {
    params.client_secret = GOOGLE_WEB_CLIENT_SECRET;
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}
