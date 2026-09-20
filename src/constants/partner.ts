import { ECONOMY_CONFIG } from "./economy";

/**
 * Partner Pairing & Confirmation Constants
 * Zero magic numbers architecture
 */

export const PARTNER_CONFIG = {
  CODE_LENGTH: 6,
  CODE_TTL_MS: 15 * ECONOMY_CONFIG.TIME.MS_PER_MINUTE, // 15 minutes
  // Alphanumeric alphabet without confusing glyphs (0, 1, I, O)
  ALPHABET: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  STORAGE_KEYS: {
    PENDING_CODE: "traki_partner_pending_code",
    PENDING_EXPIRES: "traki_partner_pending_expires",
  },
} as const;
