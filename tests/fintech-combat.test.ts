import { describe, it, expect } from "vitest";
import {
  calculateCombatStrike,
  getStreakMultiplier,
  getDiminishingMultiplier,
} from "../src/services/combatEngine";
import {
  formatCents,
  parseToCents,
  evaluateStreakOnAction,
  evaluateGoalUnlock,
} from "../src/services/economyService";
import { PlayerProfile, SavingsGoal } from "../src/types";

describe("Financial Precision & Anti-Drift", () => {
  it("formats integer cents without floating point drift", () => {
    expect(formatCents(10050)).toBe("PHP 100.50");
    expect(formatCents(1)).toBe("PHP 0.01");
    expect(formatCents(100000000)).toBe("PHP 1,000,000.00");
  });

  it("accurately sums 10,000 micro-transactions without IEEE 754 precision loss", () => {
    let totalCents = 0;
    // 10,000 transactions of 0.01 PHP (1 cent each)
    for (let i = 0; i < 10000; i++) {
      totalCents += parseToCents("0.01");
    }
    expect(totalCents).toBe(10000);
    expect(formatCents(totalCents)).toBe("PHP 100.00");
  });
});

describe("JRPG Combat Engine & Cleave Formulas", () => {
  it("calculates exact streak multipliers", () => {
    expect(getStreakMultiplier(1)).toBe(1.0);
    expect(getStreakMultiplier(3)).toBe(1.25);
    expect(getStreakMultiplier(6)).toBe(1.5);
    expect(getStreakMultiplier(10)).toBe(1.75);
    expect(getStreakMultiplier(14)).toBe(2.0);
  });

  it("applies anti-spam diminishing returns after 5th daily transaction", () => {
    expect(getDiminishingMultiplier(0)).toBe(1.0);
    expect(getDiminishingMultiplier(4)).toBe(1.0);
    expect(getDiminishingMultiplier(5)).toBe(0.5);
    expect(getDiminishingMultiplier(6)).toBe(0.3);
    expect(getDiminishingMultiplier(7)).toBe(0.1);
  });

  it("distributes concurrent cleave: 100% Daily, 35% Weekly, 15% Monthly", () => {
    // 100 base damage, Day 1 streak (1.0x), 1st log of day (1.0x), non-crit
    const strike = calculateCombatStrike({
      streakDays: 1,
      todayLogCount: 0,
      isTestCrit: false,
    });

    expect(strike.totalDamage).toBe(100);
    expect(strike.dailyDamage).toBe(100); // 100%
    expect(strike.weeklyCleave).toBe(35); // 35%
    expect(strike.monthlyCleave).toBe(15); // 15%
  });

  it("scales cleave correctly with high streak and critical strikes", () => {
    // Day 14 streak (2.0x), non-spam (1.0x), crit strike (1.5x) => 100 * 2.0 * 1.5 = 300
    const strike = calculateCombatStrike({
      streakDays: 14,
      todayLogCount: 1,
      isTestCrit: true,
    });

    expect(strike.totalDamage).toBe(300);
    expect(strike.dailyDamage).toBe(300);
    expect(strike.weeklyCleave).toBe(Math.round(300 * 0.35)); // 105
    expect(strike.monthlyCleave).toBe(Math.round(300 * 0.15)); // 45
  });
});

describe("Dual-Economy & Streak Shield Logic", () => {
  const mockProfile: PlayerProfile = {
    id: "p1",
    level: 1,
    exp: 0,
    gold: 500,
    trk_tokens: 5,
    current_streak: 10,
    highest_streak: 10,
    streak_shields: 1,
    last_logged_date: "2026-09-17",
  };

  it("consumes 1 streak shield and preserves streak when exactly 1 day is missed", () => {
    // Logged on 17th, today is 19th -> missed 18th (1 day missed)
    const result = evaluateStreakOnAction(mockProfile, "2026-09-19");
    expect(result.consumedShield).toBe(true);
    expect(result.currentStreak).toBe(11);
    expect(result.shieldsRemaining).toBe(0);
    expect(result.streakReset).toBe(false);
  });

  it("resets streak to 1 when 1 day is missed and player has 0 shields", () => {
    const shieldlessProfile: PlayerProfile = {
      ...mockProfile,
      streak_shields: 0,
    };
    const result = evaluateStreakOnAction(shieldlessProfile, "2026-09-19");
    expect(result.consumedShield).toBe(false);
    expect(result.currentStreak).toBe(1);
    expect(result.streakReset).toBe(true);
  });
});

describe("Two-Key Savings Vault Verification", () => {
  const mockGoal: SavingsGoal = {
    id: "g1",
    title: "Emergency Fund",
    target_amount: 1000000, // PHP 10,000.00
    current_amount: 800000, // PHP 8,000.00
    trk_tokens_required: 10,
    is_unlocked: 0,
    category: "savings",
    icon: "shield",
    tone: "#EAE5F4",
  };

  it("blocks unlock if funded amount is below target, even with excess TRK tokens", () => {
    const evalResult = evaluateGoalUnlock(mockGoal, 20); // 20 tokens >= 10, but 8k < 10k
    expect(evalResult.canUnlock).toBe(false);
    expect(evalResult.missingFunds).toBe(200000); // 2,000 PHP missing
  });

  it("blocks unlock if TRK tokens are below required, even if fully funded", () => {
    const fullyFundedGoal: SavingsGoal = {
      ...mockGoal,
      current_amount: 1000000,
    };
    const evalResult = evaluateGoalUnlock(fullyFundedGoal, 7); // 7 tokens < 10
    expect(evalResult.canUnlock).toBe(false);
    expect(evalResult.missingTokens).toBe(3);
  });

  it("permits unlock when BOTH funds >= target AND tokens >= required", () => {
    const readyGoal: SavingsGoal = {
      ...mockGoal,
      current_amount: 1050000, // over target
    };
    const evalResult = evaluateGoalUnlock(readyGoal, 10);
    expect(evalResult.canUnlock).toBe(true);
    expect(evalResult.missingFunds).toBe(0);
    expect(evalResult.missingTokens).toBe(0);
  });
});

describe("Self-Control Savings & Impulse Resistance Engine", () => {
  it("accumulates resisted purchases positively in wallet balance", () => {
    let startingVaultBalance = 250000; // PHP 2,500.00
    const resistedCoffees = [5000, 15000, 50000]; // ₱50, ₱150, ₱500
    
    for (const savedAmount of resistedCoffees) {
      startingVaultBalance += savedAmount;
    }
    
    expect(startingVaultBalance).toBe(320000); // PHP 3,200.00
    expect(formatCents(startingVaultBalance)).toBe("PHP 3,200.00");
  });
});

