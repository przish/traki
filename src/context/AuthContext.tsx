import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthUser, AuthProviderType } from "../types";
import {
  AuthResult,
  getCurrentAuthUser,
  signInWithApple as serviceSignInApple,
  signInWithGoogle as serviceSignInGoogle,
  signInWithDevSandbox,
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
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore stored session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const existing = await getCurrentAuthUser();
        if (existing) {
          setUser(existing);
        }
      } catch (e) {
        console.warn("Failed to restore auth session:", e);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
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

  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOutUser();
      setUser(null);
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
