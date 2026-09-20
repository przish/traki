import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("expo-apple-authentication", () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(false),
  signInAsync: vi.fn(),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
}));

vi.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: vi.fn(),
  openAuthSessionAsync: vi.fn().mockResolvedValue({ type: "success" }),
}));

vi.mock("expo-auth-session", () => ({
  makeRedirectUri: vi.fn().mockReturnValue("traki://"),
  AuthRequest: vi.fn().mockImplementation(() => ({
    promptAsync: vi.fn(),
  })),
  ResponseType: {
    Token: "token",
    Code: "code",
  },
}));

import {
  signInWithDevSandbox,
  signInWithAccountDetails,
  getCurrentAuthUser,
  signOutUser,
  signInWithApple,
  signInWithGoogle,
  isGoogleOAuthReady,
} from "../src/services/authService";
import { TrakiStorage } from "../src/services/db";
import { AUTH_CONFIG } from "../src/constants";

describe("Single Sign-On (SSO) Authentication Suite", () => {
  beforeEach(async () => {
    await TrakiStorage.clearAuthSession();
  });

  describe("Google SSO", () => {
    it("successfully creates a Google SSO user session via dev sandbox", async () => {
      const result = await signInWithDevSandbox("google");

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.provider).toBe("google");
      expect(result.user?.email).toBe(AUTH_CONFIG.DEMO_ACCOUNTS.GOOGLE[0].email);
      expect(result.user?.displayName).toBe(AUTH_CONFIG.DEMO_ACCOUNTS.GOOGLE[0].displayName);
      expect(result.user?.token).toBeDefined();

      const savedUser = await getCurrentAuthUser();
      expect(savedUser).not.toBeNull();
      expect(savedUser?.id).toBe(result.user?.id);
      expect(savedUser?.provider).toBe("google");
    });

    it("falls back to sandbox when no Google Client ID is configured in test/dev", async () => {
      const result = await signInWithGoogle({ allowSandbox: true });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.provider).toBe("google");
    });

    it("handles Google Sign In cancellation via WebBrowser cleanly", async () => {
      const WebBrowser = await import("expo-web-browser");
      vi.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValueOnce({
        type: "cancel",
      } as any);

      const result = await signInWithGoogle({ allowSandbox: true });

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(result.error).toContain("cancelled");
    });

    it("signs in with user-selected Google account details", async () => {
      const demoUser = AUTH_CONFIG.DEMO_ACCOUNTS.GOOGLE[0];
      const result = await signInWithAccountDetails({
        email: demoUser.email,
        displayName: demoUser.displayName,
        provider: "google",
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe(demoUser.email);
      expect(result.user?.displayName).toBe(demoUser.displayName);
      expect(result.user?.provider).toBe("google");

      const profile = await TrakiStorage.getProfile();
      expect(profile.partner_name).toBe(demoUser.displayName.split(" ")[0]);
    });

    it("verifies isGoogleOAuthReady status", () => {
      const ready = isGoogleOAuthReady();
      expect(typeof ready).toBe("boolean");
    });
  });

  describe("Apple SSO", () => {
    it("successfully creates an Apple SSO user session via dev sandbox", async () => {
      const result = await signInWithDevSandbox("apple");

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.provider).toBe("apple");
      expect(result.user?.email).toBe(AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.sharedEmail);
      expect(result.user?.displayName).toBe(AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.displayName);

      const profile = await TrakiStorage.getProfile();
      expect(profile.partner_name).toBe(
        AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.displayName.split(" ")[0]
      );
    });

    it("falls back to sandbox when Apple Auth is unavailable on non-iOS/simulator environments", async () => {
      const result = await signInWithApple({ allowSandbox: true });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.provider).toBe("apple");
    });

    it("signs in with Apple Private Relay selection from interactive SSO modal", async () => {
      const result = await signInWithAccountDetails({
        email: AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.relayEmail,
        displayName: AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.displayName,
        provider: "apple",
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe(AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.relayEmail);
      expect(result.user?.displayName).toBe(AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.displayName);
      expect(result.user?.provider).toBe("apple");
    });

    it("handles native Apple Sign In when available", async () => {
      const AppleAuth = await import("expo-apple-authentication");
      vi.mocked(AppleAuth.isAvailableAsync).mockResolvedValueOnce(true);
      vi.mocked(AppleAuth.signInAsync).mockResolvedValueOnce({
        user: "native_apple_user_999",
        email: "native.apple@privaterelay.appleid.com",
        fullName: {
          givenName: "Lady",
          familyName: "Hunter",
        },
        identityToken: "mock_native_token_xyz",
        authorizationCode: "mock_auth_code_123",
        realUserStatus: 1,
        state: null,
      } as any);

      const result = await signInWithApple({ allowSandbox: false });

      expect(result.success).toBe(true);
      expect(result.user?.id).toBe("apple_native_apple_user_999");
      expect(result.user?.email).toBe("native.apple@privaterelay.appleid.com");
      expect(result.user?.displayName).toBe("Lady Hunter");
      expect(result.user?.token).toBe("mock_native_token_xyz");
    });

    it("handles Apple Sign In cancellation cleanly", async () => {
      const AppleAuth = await import("expo-apple-authentication");
      vi.mocked(AppleAuth.isAvailableAsync).mockResolvedValueOnce(true);
      vi.mocked(AppleAuth.signInAsync).mockRejectedValueOnce({
        code: "ERR_REQUEST_CANCELED",
        message: "The user canceled the sign in request",
      });

      const result = await signInWithApple({ allowSandbox: false });

      expect(result.success).toBe(false);
      expect(result.cancelled).toBe(true);
      expect(result.error).toContain("cancelled");
    });

    it("handles Apple Sign In simulator error gracefully when sandbox is allowed", async () => {
      const AppleAuth = await import("expo-apple-authentication");
      vi.mocked(AppleAuth.isAvailableAsync).mockResolvedValueOnce(true);
      vi.mocked(AppleAuth.signInAsync).mockRejectedValueOnce({
        code: "ERR_REQUEST_UNKNOWN",
        message: "The authorization request failed. (1001)",
      });

      const result = await signInWithApple({ allowSandbox: true });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.provider).toBe("apple");
    });

    it("supports Stingray developer login sandbox", async () => {
      const result = await signInWithDevSandbox("stingray");

      expect(result.success).toBe(true);
      expect(result.user?.provider).toBe("stingray");
      expect(result.user?.email).toBe("stingray.dev@traki.app");
      expect(result.user?.displayName).toBe("Stingray Master");
    });
  });

  describe("Session Persistence & Sign Out", () => {
    it("persists active session across queries", async () => {
      expect(await getCurrentAuthUser()).toBeNull();

      await signInWithDevSandbox("google");
      const active = await getCurrentAuthUser();
      expect(active).not.toBeNull();
      expect(active?.email).toBe(AUTH_CONFIG.DEMO_ACCOUNTS.GOOGLE[0].email);
    });

    it("clears session completely upon sign out", async () => {
      await signInWithDevSandbox("apple");
      expect(await getCurrentAuthUser()).not.toBeNull();

      await signOutUser();
      const afterSignOut = await getCurrentAuthUser();
      expect(afterSignOut).toBeNull();
    });
  });
});
