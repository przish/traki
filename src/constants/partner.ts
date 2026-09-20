import { ECONOMY_CONFIG } from "./economy";

/**
 * Partner Pairing & Confirmation Constants
 * Zero magic numbers architecture
 */

export const PARTNER_CONFIG = {
  CODE_LENGTH: 4,
  CODE_TTL_MS: 15 * ECONOMY_CONFIG.TIME.MS_PER_MINUTE, // 15 minutes
  // 4-digit numeric code for fast and accessible partner entry
  ALPHABET: "0123456789",
  STORAGE_KEYS: {
    PENDING_CODE: "traki_partner_pending_code",
    PENDING_EXPIRES: "traki_partner_pending_expires",
  },
} as const;
