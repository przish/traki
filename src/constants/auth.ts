/**
 * Authentication & SSO Configuration Constants
 * Zero magic numbers architecture
 */

export interface GoogleDemoAccount {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly avatarUrl?: string;
  readonly provider: "google";
  readonly initial: string;
  readonly colorClass: string;
}

export const AUTH_CONFIG = {
  APP_SCHEME: "traki",

  GOOGLE_DISCOVERY: {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
    userInfoEndpoint: "https://www.googleapis.com/oauth2/v3/userinfo",
  },

  DEFAULT_AVATAR_URL: "https://lh3.googleusercontent.com/a/default-user",

  // Centralized demo & sandbox accounts for simulator/dev environments
  DEMO_ACCOUNTS: {
    GOOGLE: [
      {
        id: "demo_google_1",
        email: process.env.EXPO_PUBLIC_DEMO_GOOGLE_EMAIL_1 || "irishpureza@gmail.com",
        displayName: process.env.EXPO_PUBLIC_DEMO_GOOGLE_NAME_1 || "Irish Pureza",
        avatarUrl: "https://lh3.googleusercontent.com/a/default-user",
        provider: "google" as const,
        initial: "I",
        colorClass: "bg-red-600",
      },
      {
        id: "demo_google_2",
        email: process.env.EXPO_PUBLIC_DEMO_GOOGLE_EMAIL_2 || "quest.hunter@traki.app",
        displayName: process.env.EXPO_PUBLIC_DEMO_GOOGLE_NAME_2 || "Quest Hunter",
        avatarUrl: undefined,
        provider: "google" as const,
        initial: "Q",
        colorClass: "bg-blue-600",
      },
    ] as readonly GoogleDemoAccount[],
    APPLE: {
      displayName: process.env.EXPO_PUBLIC_DEMO_APPLE_NAME || "Irish Pureza",
      sharedEmail: process.env.EXPO_PUBLIC_DEMO_APPLE_EMAIL || "irishpureza@icloud.com",
      relayEmail:
        process.env.EXPO_PUBLIC_DEMO_APPLE_RELAY || "irish.relay@privaterelay.appleid.com",
      relayDomain: "@privaterelay.appleid.com",
    },
    STINGRAY: {
      email: process.env.EXPO_PUBLIC_DEMO_STINGRAY_EMAIL || "stingray.dev@traki.app",
      displayName: process.env.EXPO_PUBLIC_DEMO_STINGRAY_NAME || "Stingray Master",
    },
  },
} as const;
