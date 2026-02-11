import React, { createContext, useContext, useEffect, useState } from "react";
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
  const { request, response, promptAsync, redirectUri } = useGoogleAuthConfig();

  // Check for stored tokens on mount
  useEffect(() => {
    getGoogleTokens()
      .then((stored) => {
        if (stored && !isTokenExpired(stored)) {
          setTokens(stored);
        } else if (stored?.refreshToken) {
          // Try refreshing
          refreshAccessToken(stored.refreshToken)
            .then((result) => {
              const newTokens: StoredTokens = {
                accessToken: result.access_token,
                refreshToken: stored.refreshToken,
                expiresAt: Date.now() + result.expires_in * 1000,
              };
              saveGoogleTokens(newTokens);
              setTokens(newTokens);
            })
            .catch(() => {
              clearGoogleTokens();
            });
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Handle OAuth response
  useEffect(() => {
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
