/**
 * Financial & Economic Engine Constants
 * Formulated by Julia (Mathematical Logic Specialist)
 * Zero magic numbers architecture
 */

export const ECONOMY_CONFIG = {
  // Currency Settings
  DEFAULT_CURRENCY: "PHP",
  CENTS_PER_UNIT: 100,

  // Streak Evaluation Constants
  STREAK: {
    CONSECUTIVE_DAY_DIFF: 1, // Exactly 1 day diff increments streak
    SHIELD_GRACE_DAY_DIFF: 2, // Missed 1 day (diff = 2) triggers shield check
    SHIELD_CONSUMPTION_COUNT: 1,
    DEFAULT_RESET_STREAK: 1,
    INITIAL_STREAK: 1,
    INITIAL_SHIELDS: 1,
  } as const,

  // Temporal Constants (milliseconds)
  TIME: {
    MS_PER_SECOND: 1000,
    SECONDS_PER_MINUTE: 60,
    MINUTES_PER_HOUR: 60,
    HOURS_PER_DAY: 24,
    MS_PER_MINUTE: 60 * 1000,
    MS_PER_HOUR: 60 * 60 * 1000,
    MS_PER_DAY: 24 * 60 * 60 * 1000,
  } as const,
} as const;
