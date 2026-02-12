import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { useGoogleAuthConfig, exchangeCodeForTokens, refreshAccessToken } from "./google";
import {
  saveGoogleTokens,
  getGoogleTokens,
  clearGoogleTokens,
  isTokenExpired,
  StoredTokens,
} from "./tokenStorage";

interface AuthState {
  isLoading: boolean;
  isLoggedIn: boolean;
  accessToken: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getValidAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<StoredTokens | null>(null);
  const { request, response, promptAsync, discovery, redirectUri } = useGoogleAuthConfig();

  // Check for OAuth redirect code (web) or stored tokens on mount
  useEffect(() => {
    async function init() {
      // On web, check if we're returning from a Google OAuth redirect
      if (Platform.OS === "web") {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const codeVerifier = sessionStorage.getItem("pkce_code_verifier");
          sessionStorage.removeItem("pkce_code_verifier");
          // Clean auth params from URL
          window.history.replaceState({}, "", window.location.pathname);

          if (codeVerifier) {
            try {
              console.log("[Auth] Found auth code in URL, exchanging...");
              const result = await exchangeCodeForTokens(code, codeVerifier, redirectUri);
              console.log("[Auth] Token exchange succeeded");
              const newTokens: StoredTokens = {
                accessToken: result.access_token,
                refreshToken: result.refresh_token,
                expiresAt: Date.now() + result.expires_in * 1000,
              };
              await saveGoogleTokens(newTokens);
              setTokens(newTokens);
              setIsLoading(false);
              return;
            } catch (err) {
              console.error("[Auth] Token exchange error:", err);
            }
          }
        }
      }

      // Check stored tokens
      try {
        const stored = await getGoogleTokens();
        if (stored && !isTokenExpired(stored)) {
          setTokens(stored);
        } else if (stored?.refreshToken) {
          try {
            const result = await refreshAccessToken(stored.refreshToken);
            const newTokens: StoredTokens = {
              accessToken: result.access_token,
              refreshToken: stored.refreshToken,
              expiresAt: Date.now() + result.expires_in * 1000,
            };
            await saveGoogleTokens(newTokens);
            setTokens(newTokens);
          } catch {
            await clearGoogleTokens();
          }
        }
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [redirectUri]);

  // Handle OAuth response (mobile popup flow only)
  useEffect(() => {
    if (Platform.OS === "web") return; // Web uses redirect flow, handled in init
    console.log("[Auth] OAuth response:", response?.type, response);
    if (!response) return;

    if (response.type === "success" && response.params.code) {
      const code = response.params.code;
      const codeVerifier = request?.codeVerifier;
      console.log("[Auth] Got auth code, codeVerifier exists:", !!codeVerifier);
      if (!codeVerifier) return;

      exchangeCodeForTokens(code, codeVerifier, redirectUri)
        .then((result) => {
          console.log("[Auth] Token exchange succeeded");
          const newTokens: StoredTokens = {
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            expiresAt: Date.now() + result.expires_in * 1000,
          };
          saveGoogleTokens(newTokens);
          setTokens(newTokens);
        })
        .catch((err) => {
          console.error("[Auth] Token exchange error:", err);
        });
    } else if (response.type !== "success") {
      console.log("[Auth] Non-success response type:", response.type);
    }
  }, [response]);

  const login = async () => {
    if (Platform.OS === "web" && request && discovery) {
      // Use redirect flow on web to avoid COOP popup issues
      if (request.codeVerifier) {
        sessionStorage.setItem("pkce_code_verifier", request.codeVerifier);
      }
      const url = await request.makeAuthUrlAsync(discovery);
      window.location.assign(url);
      return;
    }
    await promptAsync();
  };

  const logout = async () => {
    await clearGoogleTokens();
    setTokens(null);
  };

  const getValidAccessToken = async (): Promise<string> => {
    if (!tokens) throw new Error("Not logged in");

    if (!isTokenExpired(tokens)) {
      return tokens.accessToken;
    }

    if (!tokens.refreshToken) {
      await logout();
      throw new Error("Session expired. Please sign in again.");
    }

    const result = await refreshAccessToken(tokens.refreshToken);
    const newTokens: StoredTokens = {
      accessToken: result.access_token,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + result.expires_in * 1000,
    };
    await saveGoogleTokens(newTokens);
    setTokens(newTokens);
    return newTokens.accessToken;
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isLoggedIn: tokens !== null,
        accessToken: tokens?.accessToken ?? null,
        login,
        logout,
        getValidAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
