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

  // Instant Quick Savings Strikes (₱ saved directly deals combat damage)
  QUICK_STRIKES: [
    {
      amount: 50,
      label: "Passed Coffee / Snacks",
      title: "₱50 Strike",
      subtitle: "Coffee Pass",
      icon: "coffee",
    },
    {
      amount: 150,
      label: "Skipped Takeout / Delivery",
      title: "₱150 Strike",
      subtitle: "Takeout Pass",
      icon: "silverware-fork-knife",
    },
    {
      amount: 500,
      label: "Resisted Impulse Online Buy",
      title: "₱500 Strike",
      subtitle: "Impulse Block",
      icon: "cart-off",
    },
  ] as const,

  // 16-Bit Frame-by-Frame Sprite Animation Engine Constants (Julia's Mathematical Model)
  SPRITE_ANIMATION: {
    IDLE_FRAME_MS: 160, // Classic retro pacing for breathing/stance loops (~6.25 FPS)
    ATTACK_FRAME_MS: 85, // High-speed strike frame timing (~12 FPS)
    HURT_FRAME_MS: 260, // Flinch/recoil reaction duration
    SLASH_FX_FRAME_MS: 65, // Dynamic energy blade arc progression (~15 FPS)
    TOTAL_IDLE_FRAMES: 4,
    TOTAL_ATTACK_FRAMES: 4,
    TOTAL_SLASH_FRAMES: 3,
  } as const,

  // Event-Driven Combat Animation Physics & Timings (Julia's 60 FPS Model)
  ANIMATION_PHYSICS: {
    WINDUP_MS: 70,
    LUNGE_MS: 120,
    IMPACT_DELAY_MS: 190, // WINDUP_MS + LUNGE_MS
    HIT_STUN_MS: 260,
    RECOVERY_SPRING_TENSION: 85,
    RECOVERY_SPRING_FRICTION: 4.5,
    POPUP_DURATION_MS: 1600,
    SHAKE_DURATION_MS: 35,
  } as const,

  // Combo Chain Engine (Rapid Transaction Queuing)
  COMBO_CONFIG: {
    COMBO_WINDOW_MS: 1600, // Maximum ms between hits to sustain and advance combo
    COMBO_BONUS_STEP: 0.05, // +5% bonus damage per combo stack
    MAX_COMBO_COUNT: 10,
    MAX_COMBO_MULTIPLIER: 1.5,
  } as const,
} as const;
