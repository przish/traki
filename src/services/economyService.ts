import { PlayerProfile, SavingsGoal } from "../types";
import { ECONOMY_CONFIG } from "../constants";

export interface StreakEvaluationResult {
  currentStreak: number;
  consumedShield: boolean;
  shieldsRemaining: number;
  streakReset: boolean;
}

/**
 * Disciplined financial currency formatter in integer cents to eliminate IEEE 754 drift.
 */
export function formatCents(cents: number, currency = ECONOMY_CONFIG.DEFAULT_CURRENCY): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const units = Math.floor(absCents / ECONOMY_CONFIG.CENTS_PER_UNIT);
  const remainder = absCents % ECONOMY_CONFIG.CENTS_PER_UNIT;
  const formattedUnits = units.toLocaleString("en-US");
  const formattedDecimals = remainder.toString().padStart(2, "0");
  const sign = isNegative ? "-" : "";
  return `${sign}${currency} ${formattedUnits}.${formattedDecimals}`;
}

/**
 * Converts float / user input string into integer cents safely.
 */
export function parseToCents(amountStr: string | number): number {
  if (typeof amountStr === "number") {
    return Math.round(amountStr * ECONOMY_CONFIG.CENTS_PER_UNIT);
  }
  const clean = amountStr.replace(/[^0-9.-]/g, "");
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return Math.round(num * ECONOMY_CONFIG.CENTS_PER_UNIT);
}

/**
 * Streak Evaluation Protocol:
 * Compares current date string (YYYY-MM-DD) with last logged date.
 */
export function evaluateStreakOnAction(
  profile: PlayerProfile,
  todayDateStr: string
): StreakEvaluationResult {
  if (!profile.last_logged_date) {
    return {
      currentStreak: ECONOMY_CONFIG.STREAK.INITIAL_STREAK,
      consumedShield: false,
      shieldsRemaining: profile.streak_shields,
      streakReset: false,
    };
  }

  if (profile.last_logged_date === todayDateStr) {
    // Already logged today; maintain streak
    return {
      currentStreak: profile.current_streak,
      consumedShield: false,
      shieldsRemaining: profile.streak_shields,
      streakReset: false,
    };
  }

  const lastDate = new Date(profile.last_logged_date);
  const todayDate = new Date(todayDateStr);
  const diffDays = Math.round(
    (todayDate.getTime() - lastDate.getTime()) / ECONOMY_CONFIG.TIME.MS_PER_DAY
  );

  if (diffDays === ECONOMY_CONFIG.STREAK.CONSECUTIVE_DAY_DIFF) {
    // Consecutive day logged!
    return {
      currentStreak: profile.current_streak + 1,
      consumedShield: false,
      shieldsRemaining: profile.streak_shields,
      streakReset: false,
    };
  }

  if (diffDays === ECONOMY_CONFIG.STREAK.SHIELD_GRACE_DAY_DIFF) {
    // Exactly 1 day missed! Check Streak Shield.
    if (profile.streak_shields > 0) {
      return {
        currentStreak: profile.current_streak + 1,
        consumedShield: true,
        shieldsRemaining: profile.streak_shields - ECONOMY_CONFIG.STREAK.SHIELD_CONSUMPTION_COUNT,
        streakReset: false,
      };
    } else {
      return {
        currentStreak: ECONOMY_CONFIG.STREAK.DEFAULT_RESET_STREAK,
        consumedShield: false,
        shieldsRemaining: 0,
        streakReset: true,
      };
    }
  }

  // More than 1 day missed: Streak resets
  return {
    currentStreak: ECONOMY_CONFIG.STREAK.DEFAULT_RESET_STREAK,
    consumedShield: false,
    shieldsRemaining: profile.streak_shields,
    streakReset: true,
  };
}

export interface GoalUnlockEvaluation {
  canUnlock: boolean;
  missingFunds: number; // in cents
  missingTokens: number;
  reason?: string;
}

/**
 * Two-Key Goal Unlock Verification:
 * Condition 1: Funded Amount >= Target Amount (in cents).
 * Condition 2: Player's TRK Tokens >= Goal's TRK Tokens Required.
 */
export function evaluateGoalUnlock(
  goal: SavingsGoal,
  playerTokens: number
): GoalUnlockEvaluation {
  const missingFunds = Math.max(0, goal.target_amount - goal.current_amount);
  const missingTokens = Math.max(0, goal.trk_tokens_required - playerTokens);

  if (missingFunds > 0 && missingTokens > 0) {
    return {
      canUnlock: false,
      missingFunds,
      missingTokens,
      reason: `Insufficient savings balance (${formatCents(missingFunds)}) and ${missingTokens} more TRK tokens required.`,
    };
  }

  if (missingFunds > 0) {
    return {
      canUnlock: false,
      missingFunds,
      missingTokens: 0,
      reason: `Target savings not yet reached (${formatCents(missingFunds)} remaining).`,
    };
  }

  if (missingTokens > 0) {
    return {
      canUnlock: false,
      missingFunds: 0,
      missingTokens,
      reason: `Need ${missingTokens} more TRK tokens from Weekly/Monthly Boss battles.`,
    };
  }

  return {
    canUnlock: true,
    missingFunds: 0,
    missingTokens: 0,
  };
}
