/**
 * Validation Configuration & Rules
 * Formulated by Julia (Domain Researcher & Math Specialist)
 * Zero hardcoded magic numbers or ad-hoc regex across screens.
 */

export const VALIDATION_CONFIG = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 6,
  PARTNER_CODE_LENGTH: 4,
  PARTNER_CODE_REGEX: /^[0-9]{4}$/,
  MIN_TEXT_LENGTH: 1,
  MIN_AMOUNT_CENTS: 100, // ₱1.00 minimum
} as const;

/**
 * Validates email format according to standard RFC-compliant trimmed pattern
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return VALIDATION_CONFIG.EMAIL_REGEX.test(email.trim());
}

/**
 * Validates password meets minimum security length
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== "string") return false;
  return password.length >= VALIDATION_CONFIG.MIN_PASSWORD_LENGTH;
}

/**
 * Validates password and confirm password match
 */
export function doPasswordsMatch(password: string, confirmPassword: string): boolean {
  if (!isValidPassword(password)) return false;
  return password === confirmPassword;
}

/**
 * Validates partner redemption code (4 numeric digits)
 */
export function isValidPartnerCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  return VALIDATION_CONFIG.PARTNER_CODE_REGEX.test(code.trim());
}

/**
 * Validates non-empty trimmed text (for names, titles, wallets)
 */
export function isValidNonEmptyText(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return text.trim().length >= VALIDATION_CONFIG.MIN_TEXT_LENGTH;
}

/**
 * Validates positive monetary amount
 */
export function isValidPositiveAmount(amount: number | string): boolean {
  if (typeof amount === "string") {
    const parsed = parseFloat(amount.trim());
    return !isNaN(parsed) && parsed > 0;
  }
  return typeof amount === "number" && !isNaN(amount) && amount > 0;
}
