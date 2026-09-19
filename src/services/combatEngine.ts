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
  dailyDamage: number; // 100%
  weeklyCleave: number; // 35%
  monthlyCleave: number; // 15%
}

/**
 * Calculates streak multiplier based on consecutive logging streak.
 */
export function getStreakMultiplier(streakDays: number): number {
  if (streakDays <= 1) return 1.0;
  if (streakDays <= 3) return 1.25;
  if (streakDays <= 6) return 1.5;
  if (streakDays <= 13) return 1.75;
  return 2.0;
}

/**
 * Anti-spam diminishing returns:
 * Transactions 1-5 deal full damage (1.0x).
 * Transaction 6 deals 50% damage (0.5x).
 * Transaction 7 deals 30% damage (0.3x).
 * Transaction 8+ deals 10% damage (0.1x).
 */
export function getDiminishingMultiplier(todayLogCount: number): number {
  if (todayLogCount < 5) return 1.0;
  if (todayLogCount === 5) return 0.5;
  if (todayLogCount === 6) return 0.3;
  return 0.1;
}

/**
 * Computes deterministic combat strike damage and concurrent cleaves.
 */
export function calculateCombatStrike(input: CombatCalculationInput): DamageBreakdown {
  const baseDamage = 100;
  const streakMultiplier = getStreakMultiplier(input.streakDays);
  const diminishingMultiplier = getDiminishingMultiplier(input.todayLogCount);

  // 15% chance of critical strike unless deterministic override provided
  const isCrit = input.isTestCrit !== undefined ? input.isTestCrit : Math.random() < 0.15;
  const critMultiplier = isCrit ? 1.5 : 1.0;

  const rawTotal = baseDamage * streakMultiplier * diminishingMultiplier * critMultiplier;
  const totalDamage = Math.max(1, Math.round(rawTotal));

  // Cleave distribution: 100% Daily, 35% Weekly, 15% Monthly
  const dailyDamage = totalDamage;
  const weeklyCleave = Math.round(totalDamage * 0.35);
  const monthlyCleave = Math.round(totalDamage * 0.15);

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
