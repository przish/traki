import { COMBAT_CONFIG } from "../constants";

export interface CombatCalculationInput {
  streakDays: number;
  todayLogCount: number; // How many transactions already logged today
  isTestCrit?: boolean; // For deterministic testing
}

export interface DamageBreakdown {
  baseDamage: number;
  streakMultiplier: number;
  diminishingMultiplier: number;
  isCrit: boolean;
  critMultiplier: number;
  totalDamage: number;
  dailyDamage: number;
  weeklyCleave: number;
  monthlyCleave: number;
}

/**
 * Calculates streak multiplier based on consecutive logging streak.
 */
export function getStreakMultiplier(streakDays: number): number {
  for (const tier of COMBAT_CONFIG.STREAK_TIERS) {
    if (streakDays <= tier.maxDays) {
      return tier.multiplier;
    }
  }
  return COMBAT_CONFIG.MAX_STREAK_MULTIPLIER;
}

/**
 * Anti-spam diminishing returns:
 * Transactions below full efficiency limit deal 1.0x damage.
 * Diminishing tiers apply successively.
 */
export function getDiminishingMultiplier(todayLogCount: number): number {
  const { DIMINISHING_RETURNS } = COMBAT_CONFIG;
  if (todayLogCount < DIMINISHING_RETURNS.FULL_EFFICIENCY_LIMIT) {
    return 1.0;
  }
  if (todayLogCount === DIMINISHING_RETURNS.TIER_1_LOG_COUNT) {
    return DIMINISHING_RETURNS.TIER_1_MULTIPLIER;
  }
  if (todayLogCount === DIMINISHING_RETURNS.TIER_2_LOG_COUNT) {
    return DIMINISHING_RETURNS.TIER_2_MULTIPLIER;
  }
  return DIMINISHING_RETURNS.EXHAUSTION_MULTIPLIER;
}

/**
 * Computes deterministic combat strike damage and concurrent cleaves.
 */
export function calculateCombatStrike(input: CombatCalculationInput): DamageBreakdown {
  const baseDamage = COMBAT_CONFIG.BASE_DAMAGE;
  const streakMultiplier = getStreakMultiplier(input.streakDays);
  const diminishingMultiplier = getDiminishingMultiplier(input.todayLogCount);

  // Critical strike determination
  const isCrit =
    input.isTestCrit !== undefined
      ? input.isTestCrit
      : Math.random() < COMBAT_CONFIG.CRIT.DEFAULT_CHANCE;
  const critMultiplier = isCrit
    ? COMBAT_CONFIG.CRIT.DAMAGE_MULTIPLIER
    : COMBAT_CONFIG.CRIT.NORMAL_MULTIPLIER;

  const rawTotal = baseDamage * streakMultiplier * diminishingMultiplier * critMultiplier;
  const totalDamage = Math.max(COMBAT_CONFIG.MIN_DAMAGE, Math.round(rawTotal));

  // Cleave distribution across active boss encounters
  const dailyDamage = Math.round(totalDamage * COMBAT_CONFIG.CLEAVE.DAILY_PROPORTION);
  const weeklyCleave = Math.round(totalDamage * COMBAT_CONFIG.CLEAVE.WEEKLY_PROPORTION);
  const monthlyCleave = Math.round(totalDamage * COMBAT_CONFIG.CLEAVE.MONTHLY_PROPORTION);

  return {
    baseDamage,
    streakMultiplier,
    diminishingMultiplier,
    isCrit,
    critMultiplier,
    totalDamage,
    dailyDamage,
    weeklyCleave,
    monthlyCleave,
  };
}
