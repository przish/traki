import { BossEncounter, PlayerProfile } from "../types";
import { ECONOMY_CONFIG } from "./economy";

/**
 * Boss Encounter Templates and Starter Profiles
 * Formulated by Julia & Kurt-Claude
 * Zero magic numbers architecture
 */

export const BOSS_CONFIG = {
  DAILY: {
    ID: "boss_daily",
    TIER: "daily" as const,
    NAME: "Imp of Impulsive Buys",
    TITLE: "Daily Mob",
    MAX_HP: 500,
    GOLD_REWARD: 120,
    TRK_REWARD: 0,
    EXP_REWARD: 50,
    SPRITE_KEY: "goblin",
    DURATION_MS: 12 * ECONOMY_CONFIG.TIME.MS_PER_HOUR, // 12 hours
  },
  WEEKLY: {
    ID: "boss_weekly",
    TIER: "weekly" as const,
    NAME: "The Interest Behemoth",
    TITLE: "Weekly Miniboss",
    MAX_HP: 2000,
    GOLD_REWARD: 500,
    TRK_REWARD: 3,
    EXP_REWARD: 250,
    SPRITE_KEY: "behemoth",
    DURATION_MS: 4 * ECONOMY_CONFIG.TIME.MS_PER_DAY, // 4 days
  },
  MONTHLY: {
    ID: "boss_monthly",
    TIER: "monthly" as const,
    NAME: "Titan of Inflation",
    TITLE: "Monthly Titan",
    MAX_HP: 8000,
    GOLD_REWARD: 2000,
    TRK_REWARD: 10,
    EXP_REWARD: 1000,
    SPRITE_KEY: "titan",
    DURATION_MS: 18 * ECONOMY_CONFIG.TIME.MS_PER_DAY, // 18 days
  },
} as const;

export function createDefaultBossEncounters(): BossEncounter[] {
  const now = Date.now();
  return [
    {
      id: BOSS_CONFIG.DAILY.ID,
      tier: BOSS_CONFIG.DAILY.TIER,
      name: BOSS_CONFIG.DAILY.NAME,
      title: BOSS_CONFIG.DAILY.TITLE,
      max_hp: BOSS_CONFIG.DAILY.MAX_HP,
      current_hp: BOSS_CONFIG.DAILY.MAX_HP,
      gold_reward: BOSS_CONFIG.DAILY.GOLD_REWARD,
      trk_reward: BOSS_CONFIG.DAILY.TRK_REWARD,
      exp_reward: BOSS_CONFIG.DAILY.EXP_REWARD,
      sprite_key: BOSS_CONFIG.DAILY.SPRITE_KEY,
      expires_at: new Date(now + BOSS_CONFIG.DAILY.DURATION_MS).toISOString(),
      is_defeated: 0,
    },
    {
      id: BOSS_CONFIG.WEEKLY.ID,
      tier: BOSS_CONFIG.WEEKLY.TIER,
      name: BOSS_CONFIG.WEEKLY.NAME,
      title: BOSS_CONFIG.WEEKLY.TITLE,
      max_hp: BOSS_CONFIG.WEEKLY.MAX_HP,
      current_hp: BOSS_CONFIG.WEEKLY.MAX_HP,
      gold_reward: BOSS_CONFIG.WEEKLY.GOLD_REWARD,
      trk_reward: BOSS_CONFIG.WEEKLY.TRK_REWARD,
      exp_reward: BOSS_CONFIG.WEEKLY.EXP_REWARD,
      sprite_key: BOSS_CONFIG.WEEKLY.SPRITE_KEY,
      expires_at: new Date(now + BOSS_CONFIG.WEEKLY.DURATION_MS).toISOString(),
      is_defeated: 0,
    },
    {
      id: BOSS_CONFIG.MONTHLY.ID,
      tier: BOSS_CONFIG.MONTHLY.TIER,
      name: BOSS_CONFIG.MONTHLY.NAME,
      title: BOSS_CONFIG.MONTHLY.TITLE,
      max_hp: BOSS_CONFIG.MONTHLY.MAX_HP,
      current_hp: BOSS_CONFIG.MONTHLY.MAX_HP,
      gold_reward: BOSS_CONFIG.MONTHLY.GOLD_REWARD,
      trk_reward: BOSS_CONFIG.MONTHLY.TRK_REWARD,
      exp_reward: BOSS_CONFIG.MONTHLY.EXP_REWARD,
      sprite_key: BOSS_CONFIG.MONTHLY.SPRITE_KEY,
      expires_at: new Date(now + BOSS_CONFIG.MONTHLY.DURATION_MS).toISOString(),
      is_defeated: 0,
    },
  ];
}

export const STARTER_PLAYER_PROFILE: PlayerProfile = {
  id: "player_1",
  level: 1,
  exp: 0,
  gold: 0,
  trk_tokens: 0,
  current_streak: ECONOMY_CONFIG.STREAK.INITIAL_STREAK,
  highest_streak: ECONOMY_CONFIG.STREAK.INITIAL_STREAK,
  streak_shields: ECONOMY_CONFIG.STREAK.INITIAL_SHIELDS,
  last_logged_date: null,
  partner_name: undefined,
  partner_id: undefined,
  partner_streak: 0,
};
