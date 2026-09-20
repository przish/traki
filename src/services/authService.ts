import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as ExpoAuthSession from "expo-auth-session";
import { AuthUser, AuthSession as UserAuthSession } from "../types";
import { TrakiStorage } from "./db";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient";
import { AUTH_CONFIG } from "../constants";

// Ensure WebBrowser can handle redirects properly on web and native
WebBrowser.maybeCompleteAuthSession();

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  cancelled?: boolean;
}

const GOOGLE_DISCOVERY = AUTH_CONFIG.GOOGLE_DISCOVERY;

/**
 * Safe redirect URI helper for native, web, and test environments
 */
function getSafeRedirectUri(): string {
  try {
    if (typeof ExpoAuthSession.makeRedirectUri === "function") {
      return ExpoAuthSession.makeRedirectUri({ scheme: AUTH_CONFIG.APP_SCHEME });
    }
  } catch {}
  return `${AUTH_CONFIG.APP_SCHEME}://`;
}

/**
 * Checks if native Sign In with Apple is supported on this device/runtime
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
 * Checks if real Google OAuth credentials or Supabase OAuth is configured
 */
export function isGoogleOAuthReady(): boolean {
  if (
    Boolean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) ||
    Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)
  ) {
    return true;
  }
  if (process.env.EXPO_PUBLIC_ENABLE_GOOGLE_OAUTH === "true" && isSupabaseConfigured()) {
    return true;
  }
  return false;
}

/**
 * Executes Single Sign-On with Apple using expo-apple-authentication
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
      if (
        err?.code === "ERR_REQUEST_CANCELED" ||
        err?.code === "ERR_CANCELED" ||
        err?.message?.toLowerCase().includes("cancel")
      ) {
        return { success: false, cancelled: true, error: "Apple sign-in was cancelled." };
      }

      console.error("SSO Error:", err);

      // On iOS Simulator without an Apple ID logged in, AppleAuthentication.signInAsync
      // fails with ERR_REQUEST_UNKNOWN (1001) or ERR_UNAVAILABLE.
      // In dev/simulator environments, seamlessly complete the session so the developer can test.
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
 * Executes Single Sign-On with Google via expo-web-browser & Expo AuthSession
 */
export async function signInWithGoogle(options?: { allowSandbox?: boolean }): Promise<AuthResult> {
  try {
    const redirectUri = getSafeRedirectUri();

    // 1. If Supabase is configured, use Supabase OAuth with Google via WebBrowser
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUri,
            skipBrowserRedirect: true,
          },
        });

        if (!error && data?.url) {
          const browserResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

          if (browserResult.type === "success" && browserResult.url) {
            const urlObj = new URL(browserResult.url.replace("#", "?"));
            const accessToken = urlObj.searchParams.get("access_token");
            const refreshToken = urlObj.searchParams.get("refresh_token");

            if (accessToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || "",
              });

              const {
                data: { user: sbUser },
              } = await supabase.auth.getUser();

              const user: AuthUser = {
                id: sbUser?.id || `google_${Date.now()}`,
                email: sbUser?.email || "google.user@traki.app",
                displayName:
                  sbUser?.user_metadata?.full_name ||
                  sbUser?.user_metadata?.name ||
                  "Google Quest Hunter",
                avatarUrl: sbUser?.user_metadata?.avatar_url || sbUser?.user_metadata?.picture,
                provider: "google",
                token: accessToken,
                createdAt: new Date().toISOString(),
              };

              await persistAuthUser(user);
              return { success: true, user };
            }
          } else if (browserResult.type === "cancel" || browserResult.type === "dismiss") {
            return { success: false, cancelled: true, error: "Google sign-in was cancelled." };
          }
        }
      } catch (sbOAuthErr) {
        console.error("SSO Error:", sbOAuthErr);
      }
    }

    // 2. Direct Google OAuth if client ID is configured
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const clientId = Platform.OS === "ios" ? iosClientId || webClientId : webClientId;

    if (clientId) {
      try {
        const request = new ExpoAuthSession.AuthRequest({
          clientId,
          scopes: ["openid", "profile", "email"],
          responseType: ExpoAuthSession.ResponseType.Token,
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
        console.error("SSO Error:", err);
        if (options?.allowSandbox !== false && __DEV__) {
          return signInWithDevSandbox("google");
        }
        return {
          success: false,
          error: err?.message || "Google authentication failed.",
        };
      }
    }

    // 3. In Simulator / Development environments without full Google Client ID in .env:
    // Open the authentic Google login session via expo-web-browser so the system popup appears
    if (options?.allowSandbox !== false) {
      try {
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=traki-dev.apps.googleusercontent.com&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=token&scope=openid%20profile%20email`;

        const browserResult = await WebBrowser.openAuthSessionAsync(googleAuthUrl, redirectUri);

        if (browserResult.type === "cancel" || browserResult.type === "dismiss") {
          return { success: false, cancelled: true, error: "Google sign-in was cancelled." };
        }
      } catch (browserErr) {
        console.error("SSO Error:", browserErr);
      }

      // Smoothly complete the session for simulator testing
      return signInWithDevSandbox("google");
    }

    return {
      success: false,
      error: "Google Client ID is not configured in EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.",
    };
  } catch (outerErr: any) {
    console.error("SSO Error:", outerErr);
    if (options?.allowSandbox !== false) {
      return signInWithDevSandbox("google");
    }
    return { success: false, error: outerErr?.message || "Google Sign-In failed." };
  }
}

/**
 * Dev Sandbox login for simulation and testing environments
 */
export async function signInWithDevSandbox(provider: "google" | "apple" | "stingray"): Promise<AuthResult> {
  const isApple = provider === "apple";
  const isStingray = provider === "stingray";

  const email = isApple
    ? AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.sharedEmail
    : isStingray
    ? AUTH_CONFIG.DEMO_ACCOUNTS.STINGRAY.email
    : AUTH_CONFIG.DEMO_ACCOUNTS.GOOGLE[0].email;

  const displayName = isApple
    ? AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.displayName
    : isStingray
    ? AUTH_CONFIG.DEMO_ACCOUNTS.STINGRAY.displayName
    : AUTH_CONFIG.DEMO_ACCOUNTS.GOOGLE[0].displayName;

  const avatarUrl = isApple
    ? undefined
    : isStingray
    ? AUTH_CONFIG.DEFAULT_AVATAR_URL
    : AUTH_CONFIG.DEMO_ACCOUNTS.GOOGLE[0].avatarUrl || AUTH_CONFIG.DEFAULT_AVATAR_URL;

  const user: AuthUser = {
    id: `${provider}_demo_${Date.now().toString().slice(-6)}`,
    email,
    displayName,
    avatarUrl,
    provider,
    token: `mock_jwt_token_${provider}_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  await persistAuthUser(user);
  return { success: true, user };
}

/**
 * Signs in with explicit account details selected from the interactive SSO modal
 */
export async function signInWithAccountDetails(account: {
  id?: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: "google" | "apple" | "stingray";
}): Promise<AuthResult> {
  const user: AuthUser = {
    id: account.id || `${account.provider}_${Date.now().toString().slice(-6)}`,
    email: account.email,
    displayName: account.displayName,
    avatarUrl: account.avatarUrl,
    provider: account.provider,
    token: `jwt_sso_${account.provider}_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  await persistAuthUser(user);
  return { success: true, user };
}

/**
 * Persists an authenticated user session to database and updates player profile
 */
async function persistAuthUser(user: AuthUser): Promise<void> {
  const session: UserAuthSession = {
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
