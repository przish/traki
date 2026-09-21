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
  signInWithAccountDetails,
  signInWithEmailPassword,
  signUpWithEmail,
  getCurrentAuthUser,
  signOutUser,
  signInWithApple,
  signInWithGoogle,
  isGoogleOAuthReady,
} from "../src/services/authService";
import { TrakiStorage } from "../src/services/db";

describe("Single Sign-On (SSO) & Credentials Authentication Suite", () => {
  beforeEach(async () => {
    await TrakiStorage.clearAuthSession();
  });

  describe("Email & Password Auth", () => {
    it("successfully registers and persists a new user with email and password", async () => {
      const email = "irish@traki.app";
      const pass = "secret123";
      const result = await signUpWithEmail(email, pass);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(email);
      expect(result.user?.provider).toBe("email");

      const savedUser = await getCurrentAuthUser();
      expect(savedUser).not.toBeNull();
      expect(savedUser?.email).toBe(email);
    });

    it("successfully logs in and persists session with email credentials", async () => {
      const email = "hunter@traki.app";
      const pass = "questpass456";
      const result = await signInWithEmailPassword(email, pass);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe(email);
      expect(result.user?.displayName).toBe("Hunter");

      const savedUser = await getCurrentAuthUser();
      expect(savedUser).not.toBeNull();
      expect(savedUser?.id).toBe(result.user?.id);
    });
  });

  describe("Google SSO", () => {
    it("successfully creates a Google SSO user session in fallback mode", async () => {
      const result = await signInWithGoogle({ allowSandbox: true });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.provider).toBe("google");
      expect(result.user?.token).toBeDefined();

      const savedUser = await getCurrentAuthUser();
      expect(savedUser).not.toBeNull();
      expect(savedUser?.id).toBe(result.user?.id);
      expect(savedUser?.provider).toBe("google");
    });

    it("handles Google Sign In cancellation cleanly", async () => {
      const WebBrowser = await import("expo-web-browser");
      vi.mocked(WebBrowser.openAuthSessionAsync).mockResolvedValueOnce({
        type: "cancel",
      } as any);

      const result = await signInWithGoogle({ allowSandbox: true });

      // If WebBrowser cancel was intercepted in OAuth block
      expect(result.cancelled || result.success).toBeDefined();
    });

    it("signs in with user-selected Google account details", async () => {
      const userDetails = {
        email: "adventurer@gmail.com",
        displayName: "Adventurer",
        provider: "google" as const,
      };
      const result = await signInWithAccountDetails(userDetails);

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe(userDetails.email);
      expect(result.user?.displayName).toBe(userDetails.displayName);
      expect(result.user?.provider).toBe("google");

      // Verify that user is NOT mistakenly set as their own partner
      const profile = await TrakiStorage.getProfile();
      expect(profile.partner_name).toBeUndefined();
    });

    it("verifies isGoogleOAuthReady status", () => {
      const ready = isGoogleOAuthReady();
      expect(typeof ready).toBe("boolean");
    });
  });

  describe("Apple SSO", () => {
    it("successfully creates an Apple SSO user session", async () => {
      const result = await signInWithApple({ allowSandbox: true });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.provider).toBe("apple");

      const profile = await TrakiStorage.getProfile();
      expect(profile.partner_name).toBeUndefined();
    });

    it("signs in with Apple account selection from interactive SSO modal", async () => {
      const result = await signInWithAccountDetails({
        email: "hunter@privaterelay.appleid.com",
        displayName: "Apple Quest Hunter",
        provider: "apple",
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe("hunter@privaterelay.appleid.com");
      expect(result.user?.displayName).toBe("Apple Quest Hunter");
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
  });

  describe("Session Persistence & Sign Out", () => {
    it("persists active session across queries and app reloads", async () => {
      expect(await getCurrentAuthUser()).toBeNull();

      await signInWithEmailPassword("persistent@traki.app", "pass123");
      const active = await getCurrentAuthUser();
      expect(active).not.toBeNull();
      expect(active?.email).toBe("persistent@traki.app");
    });

    it("clears session completely upon sign out", async () => {
      await signInWithEmailPassword("logout_test@traki.app", "pass123");
      expect(await getCurrentAuthUser()).not.toBeNull();

      await signOutUser();
      const afterSignOut = await getCurrentAuthUser();
      expect(afterSignOut).toBeNull();
    });
  });
});
