/**
 * Centralized Design & Theme Color Tokens
 * Zero hardcoded raw hex strings architecture
 */

export const THEME_CONFIG = {
  COLORS: {
    // Primary Brand Crimson
    BRAND: "#AF2219",
    BRAND_HOVER: "#8F1E2C",
    BRAND_DARK: "#8F1E2C",
    BRAND_SECONDARY: "#A13024",
    BRAND_TINT_15: "rgba(175, 34, 25, 0.15)",
    BRAND_TINT_30: "rgba(175, 34, 25, 0.30)",
    BRAND_TINT_40: "rgba(175, 34, 25, 0.40)",

    // Status Colors
    SUCCESS: "#1C5E2D",
    SUCCESS_BG: "#E8F5E9",
    WARNING: "#F59E0B",
    ERROR: "#DC2626",
    INFO: "#2563EB",

    // Neutral Surfaces
    BG_LIGHT: "#FAF8F6",
    BG_DARK: "#101112",
    SURFACE_WHITE: "#FFFFFF",
    SURFACE_MUTED: "#F5F5F4",
    BORDER_LIGHT: "#E7E5E4",
    TEXT_MAIN: "#1C1917",
    TEXT_MUTED: "#8B8988",
    TEXT_PLACEHOLDER: "#A8A29E",

    // Wallet Type Accent Colors
    WALLET: {
      BANK: "#3B82F6",
      CASH: "#10B981",
      CREDIT: "#F59E0B",
      SAVINGS: "#8B5CF6",
    },
  },

  TAB_BAR: {
    BOTTOM_OFFSET_IOS: 24,
    BOTTOM_OFFSET_ANDROID: 16,
    SCREEN_PADDING_BOTTOM: 120,
    BLUR_INTENSITY: 75,
  },
} as const;
