import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthUser, AuthProviderType } from "../types";
import {
  AuthResult,
  getCurrentAuthUser,
  signInWithApple as serviceSignInApple,
  signInWithGoogle as serviceSignInGoogle,
  signInWithDevSandbox,
  signInWithAccountDetails,
  signOutUser,
} from "../services/authService";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  error: string | null;
  signInWithGoogle: (options?: { allowSandbox?: boolean }) => Promise<AuthResult>;
  signInWithApple: (options?: { allowSandbox?: boolean }) => Promise<AuthResult>;
  signInWithSandbox: (provider: AuthProviderType) => Promise<AuthResult>;
  signInWithCustomAccount: (account: {
    id?: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    provider: "google" | "apple" | "stingray";
  }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore stored session on mount and subscribe to Supabase auth events.
  // This is the single source of truth for login state — it must run once on
  // app boot and resolve before any screen makes auth-dependent decisions.
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        // 1. Restore local (SQLite / localStorage) session first — works for
        //    sandbox/demo accounts and native SQLite sessions.
        const existing = await getCurrentAuthUser();
        if (mounted && existing) {
          setUser(existing);
        }
      } catch (e) {
        console.warn("Failed to restore auth session:", e);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    // 2. Subscribe to Supabase auth state changes so we never miss a
    //    SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED event from the server.
    //    This covers: OAuth redirects, token auto-refresh, server-side logouts.
    let unsubSupabase: (() => void) | null = null;
    try {
      // Lazy import to avoid crashes when Supabase is not configured
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getSupabaseClient, isSupabaseConfigured } = require("../services/supabaseClient");
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: listenerData } = supabase.auth.onAuthStateChange(
            async (event: string, session: any) => {
              if (!mounted) return;

              if (event === "SIGNED_IN" && session?.user) {
                const sbUser = session.user;
                const authUser: AuthUser = {
                  id: sbUser.id,
                  email: sbUser.email || "",
                  displayName:
                    sbUser.user_metadata?.full_name ||
                    sbUser.user_metadata?.name ||
                    sbUser.email ||
                    "Adventurer",
                  avatarUrl:
                    sbUser.user_metadata?.avatar_url ||
                    sbUser.user_metadata?.picture,
                  provider:
                    (sbUser.app_metadata?.provider as AuthUser["provider"]) ||
                    "google",
                  token: session.access_token,
                  createdAt: sbUser.created_at || new Date().toISOString(),
                };
                setUser(authUser);
                setIsLoading(false);
              } else if (event === "SIGNED_OUT") {
                // Only clear if we were explicitly signed out server-side.
                // Do NOT clear on TOKEN_REFRESHED or other benign events.
                const stillHasLocal = await getCurrentAuthUser();
                if (!stillHasLocal) {
                  setUser(null);
                }
                setIsLoading(false);
              } else if (event === "TOKEN_REFRESHED" && session?.user) {
                // Token refreshed — update user silently without disrupting UX.
                setUser((prev) => {
                  if (!prev) return prev;
                  return { ...prev, token: session.access_token };
                });
              }
            }
          );
          unsubSupabase = () => listenerData?.subscription?.unsubscribe();
        }
      }
    } catch {
      // Supabase not configured or failed to load — local auth only, safe to ignore.
    }

    return () => {
      mounted = false;
      unsubSupabase?.();
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signInWithGoogle = useCallback(async (options?: { allowSandbox?: boolean }): Promise<AuthResult> => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const result = await serviceSignInGoogle(options);
      if (result.success && result.user) {
        setUser(result.user);
      } else if (!result.cancelled && result.error) {
        setError(result.error);
      }
      return result;
    } catch (err: any) {
      const msg = err?.message || "Google sign-in encountered an error.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const signInWithApple = useCallback(async (options?: { allowSandbox?: boolean }): Promise<AuthResult> => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const result = await serviceSignInApple(options);
      if (result.success && result.user) {
        setUser(result.user);
      } else if (!result.cancelled && result.error) {
        setError(result.error);
      }
      return result;
    } catch (err: any) {
      const msg = err?.message || "Apple sign-in encountered an error.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const signInWithSandbox = useCallback(async (provider: AuthProviderType): Promise<AuthResult> => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const validProvider = provider === "apple" ? "apple" : provider === "stingray" ? "stingray" : "google";
      const result = await signInWithDevSandbox(validProvider);
      if (result.success && result.user) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const signInWithCustomAccount = useCallback(
    async (account: {
      id?: string;
      email: string;
      displayName: string;
      avatarUrl?: string;
      provider: "google" | "apple" | "stingray";
    }): Promise<AuthResult> => {
      setIsAuthenticating(true);
      setError(null);
      try {
        const result = await signInWithAccountDetails(account);
        if (result.success && result.user) {
          setUser(result.user);
        }
        return result;
      } finally {
        setIsAuthenticating(false);
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOutUser();
      setUser(null);
      // Also sign out from Supabase if configured
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getSupabaseClient, isSupabaseConfigured } = require("../services/supabaseClient");
        if (isSupabaseConfigured()) {
          const supabase = getSupabaseClient();
          if (supabase) {
            await supabase.auth.signOut();
          }
        }
      } catch {
        // Supabase sign-out is best-effort — local clear already done above.
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticating,
        error,
        signInWithGoogle,
        signInWithApple,
        signInWithSandbox,
        signInWithCustomAccount,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
