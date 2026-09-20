/**
 * Combat & Battle Engine Constants
 * Formulated by Julia (Mathematical Logic Specialist)
 * Zero magic numbers architecture
 */

export const COMBAT_CONFIG = {
  // Base attack damage per logged transaction
  BASE_DAMAGE: 100,

  // Minimum clamped damage per strike
  MIN_DAMAGE: 1,

  // Streak Multiplier Tiers: [maxStreakDaysInclusive, multiplier]
  STREAK_TIERS: [
    { maxDays: 1, multiplier: 1.0 },
    { maxDays: 3, multiplier: 1.25 },
    { maxDays: 6, multiplier: 1.5 },
    { maxDays: 13, multiplier: 1.75 },
  ] as const,
  MAX_STREAK_MULTIPLIER: 2.0,

  // Anti-Spam Diminishing Returns Tiers: based on transactions logged today
  DIMINISHING_RETURNS: {
    FULL_EFFICIENCY_LIMIT: 5, // Logs 0-4 get 1.0x
    TIER_1_LOG_COUNT: 5, // 6th log
    TIER_1_MULTIPLIER: 0.5,
    TIER_2_LOG_COUNT: 6, // 7th log
    TIER_2_MULTIPLIER: 0.3,
    EXHAUSTION_MULTIPLIER: 0.1, // 8th+ logs
  } as const,

  // Critical Strike Mechanics
  CRIT: {
    DEFAULT_CHANCE: 0.15, // 15% probability
    DAMAGE_MULTIPLIER: 1.5, // 150% damage
    NORMAL_MULTIPLIER: 1.0,
  } as const,

  // Concurrent Cleave Distribution: split across active boss tiers
  CLEAVE: {
    DAILY_PROPORTION: 1.0, // 100% of damage
    WEEKLY_PROPORTION: 0.35, // 35% of damage
    MONTHLY_PROPORTION: 0.15, // 15% of damage
  } as const,
} as const;
