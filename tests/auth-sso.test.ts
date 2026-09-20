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
}));

import {
  signInWithDevSandbox,
  signInWithAccountDetails,
  getCurrentAuthUser,
  signOutUser,
  signInWithApple,
  signInWithGoogle,
} from "../src/services/authService";
import { TrakiStorage } from "../src/services/db";

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
      expect(result.user?.email).toContain("google.hunter@traki.app");
      expect(result.user?.displayName).toBe("Google Quest Hunter");
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

    it("signs in with user-selected Google account details from interactive SSO modal", async () => {
      const result = await signInWithAccountDetails({
        email: "irishpureza@gmail.com",
        displayName: "Irish Pureza",
        provider: "google",
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe("irishpureza@gmail.com");
      expect(result.user?.displayName).toBe("Irish Pureza");
      expect(result.user?.provider).toBe("google");

      const profile = await TrakiStorage.getProfile();
      expect(profile.partner_name).toBe("Irish");
    });
  });

  describe("Apple SSO", () => {
    it("successfully creates an Apple SSO user session via dev sandbox", async () => {
      const result = await signInWithDevSandbox("apple");

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.provider).toBe("apple");
      expect(result.user?.email).toContain("apple.hunter@traki.app");
      expect(result.user?.displayName).toBe("Apple Quest Hunter");

      const profile = await TrakiStorage.getProfile();
      expect(profile.partner_name).toBe("Apple");
    });

    it("falls back to sandbox when Apple Auth is unavailable on non-iOS/simulator environments", async () => {
      const result = await signInWithApple({ allowSandbox: true });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.provider).toBe("apple");
    });

    it("signs in with Apple Private Relay selection from interactive SSO modal", async () => {
      const result = await signInWithAccountDetails({
        email: "irish.relay@privaterelay.appleid.com",
        displayName: "Irish Pureza",
        provider: "apple",
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe("irish.relay@privaterelay.appleid.com");
      expect(result.user?.displayName).toBe("Irish Pureza");
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
      expect(active?.email).toBe("google.hunter@traki.app");
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
