/**
 * Authentication & SSO Configuration Constants
 * Zero magic numbers architecture
 */

export const AUTH_CONFIG = {
  APP_SCHEME: "traki",

  GOOGLE_DISCOVERY: {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    revocationEndpoint: "https://oauth2.googleapis.com/revoke",
    userInfoEndpoint: "https://www.googleapis.com/oauth2/v3/userinfo",
  },

  DEFAULT_AVATAR_URL: "https://lh3.googleusercontent.com/a/default-user",
  DEFAULT_HERO_NAME: "Quest Hunter",
} as const;
