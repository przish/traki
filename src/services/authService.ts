import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { AuthUser, AuthSession } from "../types";
import { TrakiStorage } from "./db";

// Ensure WebBrowser can handle redirects properly on web
WebBrowser.maybeCompleteAuthSession();

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  cancelled?: boolean;
}

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
  userInfoEndpoint: "https://www.googleapis.com/oauth2/v3/userinfo",
};

/**
 * Checks if native Sign In with Apple is supported on this device
 */
export async function isAppleAuthAvailable(): Promise<boolean> {
  try {
    if (typeof AppleAuthentication.isAvailableAsync === "function") {
      return await AppleAuthentication.isAvailableAsync();
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Executes Single Sign-On with Apple
 */
export async function signInWithApple(options?: { allowSandbox?: boolean }): Promise<AuthResult> {
  const isAvailable = await isAppleAuthAvailable();

  if (isAvailable) {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const givenName = credential.fullName?.givenName ?? "";
      const familyName = credential.fullName?.familyName ?? "";
      const displayName = [givenName, familyName].filter(Boolean).join(" ") || "Apple Adventurer";
      const email = credential.email || `apple.${credential.user.slice(0, 8)}@privaterelay.appleid.com`;

      const user: AuthUser = {
        id: `apple_${credential.user}`,
        email,
        displayName,
        avatarUrl: undefined,
        provider: "apple",
        token: credential.identityToken ?? undefined,
        createdAt: new Date().toISOString(),
      };

      await persistAuthUser(user);
      return { success: true, user };
    } catch (err: any) {
      if (err?.code === "ERR_REQUEST_CANCELED" || err?.code === "ERR_CANCELED") {
        return { success: false, cancelled: true, error: "Apple sign-in was cancelled." };
      }
      console.warn("Apple Sign-In error:", err);
      // If native failed on simulator or dev build, check if sandbox allowed
      if (options?.allowSandbox !== false && __DEV__) {
        return signInWithDevSandbox("apple");
      }
      return {
        success: false,
        error: err?.message || "Apple authentication failed. Please try again.",
      };
    }
  }

  // Fallback for Simulator / Web / Dev mode where Apple Sign In is not available
  if (options?.allowSandbox !== false) {
    return signInWithDevSandbox("apple");
  }

  return {
    success: false,
    error: "Apple Sign-In is only available on supported iOS devices.",
  };
}

/**
 * Executes Single Sign-On with Google via Expo AuthSession or Dev Sandbox
 */
export async function signInWithGoogle(options?: { allowSandbox?: boolean }): Promise<AuthResult> {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const clientId = Platform.OS === "ios" ? iosClientId || webClientId : webClientId;

  // If real Google OAuth Client ID is configured, trigger OAuth flow
  if (clientId) {
    try {
      // Dynamic import to support SSR/test environments safely
      const AuthSession = await import("expo-auth-session");
      const redirectUri = AuthSession.makeRedirectUri({ scheme: "traki" });

      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: ["openid", "profile", "email"],
        responseType: AuthSession.ResponseType.Token,
        redirectUri,
      });

      const response = await request.promptAsync(GOOGLE_DISCOVERY);

      if (response.type === "success" && response.authentication?.accessToken) {
        const token = response.authentication.accessToken;
        const userInfoRes = await fetch(GOOGLE_DISCOVERY.userInfoEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userInfoRes.ok) {
          const profile = await userInfoRes.json();
          const user: AuthUser = {
            id: `google_${profile.sub || Date.now()}`,
            email: profile.email || "user@gmail.com",
            displayName: profile.name || "Google Hunter",
            avatarUrl: profile.picture,
            provider: "google",
            token,
            createdAt: new Date().toISOString(),
          };

          await persistAuthUser(user);
          return { success: true, user };
        }
      } else if (response.type === "cancel" || response.type === "dismiss") {
        return { success: false, cancelled: true, error: "Google sign-in was cancelled." };
      }
    } catch (err: any) {
      console.warn("Google OAuth prompt error:", err);
      if (options?.allowSandbox !== false && __DEV__) {
        return signInWithDevSandbox("google");
      }
      return {
        success: false,
        error: err?.message || "Google authentication failed.",
      };
    }
  }

  // If no Google Client ID is configured in .env, seamlessly use the Dev Sandbox
  if (options?.allowSandbox !== false) {
    return signInWithDevSandbox("google");
  }

  return {
    success: false,
    error: "Google Client ID is not configured in EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.",
  };
}

/**
 * Dev Sandbox login for simulation and testing environments
 */
export async function signInWithDevSandbox(provider: "google" | "apple" | "stingray"): Promise<AuthResult> {
  const isApple = provider === "apple";
  const isStingray = provider === "stingray";

  const user: AuthUser = {
    id: `${provider}_demo_${Date.now().toString().slice(-6)}`,
    email: isApple
      ? "apple.hunter@traki.app"
      : isStingray
      ? "stingray.dev@traki.app"
      : "google.hunter@traki.app",
    displayName: isApple
      ? "Apple Quest Hunter"
      : isStingray
      ? "Stingray Master"
      : "Google Quest Hunter",
    avatarUrl: isApple ? undefined : "https://lh3.googleusercontent.com/a/default-user",
    provider,
    token: `mock_jwt_token_${provider}_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  await persistAuthUser(user);
  return { success: true, user };
}

/**
 * Persists an authenticated user session to database and updates player profile
 */
async function persistAuthUser(user: AuthUser): Promise<void> {
  const session: AuthSession = {
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    avatar_url: user.avatarUrl,
    provider: user.provider,
    token: user.token,
    created_at: user.createdAt,
  };

  await TrakiStorage.saveAuthSession(session);

  // Update player profile to reflect authenticated name
  await TrakiStorage.updateProfile({
    partner_name: user.displayName.split(" ")[0],
  });
}

/**
 * Fetches current authenticated session from database
 */
export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const session = await TrakiStorage.getAuthSession();
  if (!session) return null;

  return {
    id: session.id,
    email: session.email,
    displayName: session.display_name,
    avatarUrl: session.avatar_url,
    provider: session.provider,
    token: session.token,
    createdAt: session.created_at,
  };
}

/**
 * Logs out and clears active authentication session
 */
export async function signOutUser(): Promise<void> {
  await TrakiStorage.clearAuthSession();
}
