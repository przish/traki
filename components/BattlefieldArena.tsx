import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  Image,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import Svg, { Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import { BossEncounter, CombatStrikeResult, PlayerProfile } from "@/src/types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { THEME_CONFIG } from "@/src/constants/theme";
import { COMBAT_CONFIG } from "@/src/constants/combat";

// 16-Bit JRPG Pixel Art Frame Sprites
const SPRITE_HERO_IDLE = require("@/assets/images/sprites/hero.jpg");
const SPRITE_HERO_ATTACK_1 = require("@/assets/images/sprites/hero_attack_1.jpg");
const SPRITE_HERO_ATTACK_2 = require("@/assets/images/sprites/hero_attack_2.jpg");

const SPRITE_DAILY_IMP_IDLE = require("@/assets/images/sprites/daily_imp.jpg");
const SPRITE_DAILY_IMP_HURT = require("@/assets/images/sprites/daily_imp_hurt.jpg");

const SPRITE_WEEKLY_PHANTOM_IDLE = require("@/assets/images/sprites/weekly_phantom.jpg");
const SPRITE_WEEKLY_PHANTOM_HURT = require("@/assets/images/sprites/phantom_hurt.jpg");

const SPRITE_MONTHLY_TITAN_IDLE = require("@/assets/images/sprites/monthly_titan.jpg");
const SPRITE_MONTHLY_TITAN_HURT = require("@/assets/images/sprites/titan_hurt.jpg");

const SPRITE_SLASH_CRESCENT = require("@/assets/images/sprites/slash_fx.jpg");
const SPRITE_SLASH_BURST = require("@/assets/images/sprites/slash_burst.jpg");

export interface BattlefieldArenaProps {
  boss: BossEncounter;
  profile: PlayerProfile | null;
  activeTier: "daily" | "weekly" | "monthly";
  onSelectTier: (tier: "daily" | "weekly" | "monthly") => void;
  onExecuteSavingsStrike: (
    amount: number,
    label: string,
    catId?: string
  ) => Promise<CombatStrikeResult | void>;
  isStriking?: boolean;
}

interface FloatingPopup {
  id: string;
  damageText: string;
  lootText?: string;
  isCrit: boolean;
  animY: Animated.Value;
  animOpacity: Animated.Value;
}

type HeroAnimState = "idle" | "windup" | "slash";
type MobAnimState = "idle" | "hurt";
type SlashAnimState = "none" | "crescent" | "burst";

export default function BattlefieldArena({
  boss,
  profile,
  activeTier,
  onSelectTier,
  onExecuteSavingsStrike,
  isStriking = false,
}: BattlefieldArenaProps) {
  const isDark = useColorScheme() === "dark";

  // Animation values (React 19 compiler compliant)
  const [heroTranslateX] = useState(() => new Animated.Value(0));
  const [heroTranslateY] = useState(() => new Animated.Value(0));
  const [heroScale] = useState(() => new Animated.Value(1));
  const [heroRotate] = useState(() => new Animated.Value(0));

  const [mobTranslateX] = useState(() => new Animated.Value(0));
  const [mobTranslateY] = useState(() => new Animated.Value(0));
  const [mobScale] = useState(() => new Animated.Value(1));
  const [mobFlashOpacity] = useState(() => new Animated.Value(0));

  const [slashOpacity] = useState(() => new Animated.Value(0));
  const [slashScale] = useState(() => new Animated.Value(0.4));
  const [slashRotate] = useState(() => new Animated.Value(0));

  const [coinTranslateY] = useState(() => new Animated.Value(0));
  const [coinOpacity] = useState(() => new Animated.Value(0));

  const [stageShakeX] = useState(() => new Animated.Value(0));
  const [hpCleaveAnim] = useState(() => new Animated.Value(boss.current_hp));

  // Frame-by-frame sprite state machine
  const [heroAnimState, setHeroAnimState] = useState<HeroAnimState>("idle");
  const [mobAnimState, setMobAnimState] = useState<MobAnimState>("idle");
  const [slashAnimState, setSlashAnimState] = useState<SlashAnimState>("none");

  const [popups, setPopups] = useState<FloatingPopup[]>([]);
  const [animatingStrike, setAnimatingStrike] = useState(false);

  // Active timers tracking for safe cleanup (Janitor anti-leak standard)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

  // Idle floating animation loops
  useEffect(() => {
    const heroIdle = Animated.loop(
      Animated.sequence([
        Animated.timing(heroTranslateY, {
          toValue: -5,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(heroTranslateY, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const mobIdle = Animated.loop(
      Animated.sequence([
        Animated.timing(mobTranslateY, {
          toValue: -7,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(mobTranslateY, {
          toValue: 2,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    heroIdle.start();
    mobIdle.start();

    return () => {
      heroIdle.stop();
      mobIdle.stop();
    };
  }, [heroTranslateY, mobTranslateY]);

  // HP Bar sync
  useEffect(() => {
    Animated.timing(hpCleaveAnim, {
      toValue: boss.current_hp,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [boss.current_hp, hpCleaveAnim]);

  // Trigger full attack animation sequence with frame-by-frame sprite progression
  const playAttackAnimation = useCallback(
    (strikeResult?: CombatStrikeResult, customLabel?: string) => {
      setAnimatingStrike(true);

      const isCrit = strikeResult?.isCrit ?? false;
      const dmg = strikeResult?.totalDamage ?? 100;
      const gold = strikeResult?.goldEarned ?? Math.round(dmg * 0.5);
      const exp = strikeResult?.expEarned ?? Math.round(dmg * 0.25);
      const trk = activeTier === "daily" ? 2 : activeTier === "weekly" ? 15 : 50;

      const animY = new Animated.Value(0);
      const animOpacity = new Animated.Value(1);

      const newPopup: FloatingPopup = {
        id: `pop_${Date.now()}_${Math.random()}`,
        damageText: isCrit ? `💥 CRIT! -${dmg} HP` : `⚔️ -${dmg} HP`,
        lootText: `+${gold} Gold • +${exp} EXP • +${trk} TRK`,
        isCrit,
        animY,
        animOpacity,
      };
      setPopups((prev) => [...prev.slice(-2), newPopup]);

      // Animate popup upward drift and fade
      Animated.parallel([
        Animated.timing(animY, {
          toValue: -32,
          duration: 1300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 1300,
          delay: 350,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // Stage camera shake
      Animated.sequence([
        Animated.timing(stageShakeX, { toValue: isCrit ? -8 : -5, duration: 35, useNativeDriver: true }),
        Animated.timing(stageShakeX, { toValue: isCrit ? 8 : 5, duration: 35, useNativeDriver: true }),
        Animated.timing(stageShakeX, { toValue: isCrit ? -5 : -3, duration: 35, useNativeDriver: true }),
        Animated.timing(stageShakeX, { toValue: isCrit ? 5 : 3, duration: 35, useNativeDriver: true }),
        Animated.timing(stageShakeX, { toValue: 0, duration: 35, useNativeDriver: true }),
      ]).start();

      // Coin burst particles
      coinTranslateY.setValue(0);
      coinOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(coinTranslateY, {
          toValue: -40,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(coinOpacity, {
          toValue: 0,
          duration: 600,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // ─── FRAME-BY-FRAME SPRITE TIMELINE (Julia's Mathematical Model) ───
      // 1. Frame 1: Wind-up (Hero pulls blade over shoulder into power stance)
      setHeroAnimState("windup");

      // 2. Frame 2: Forward Dash & Full Cleave (Hero swings greatsword with motion trail)
      const t1 = setTimeout(() => {
        setHeroAnimState("slash");
      }, COMBAT_CONFIG.SPRITE_ANIMATION.ATTACK_FRAME_MS);

      // 3. Impact Moment (Slash FX frames + Mob Hurt frame)
      const t2 = setTimeout(() => {
        // Slash Frame 1: Crescent blade
        setSlashAnimState("crescent");
        // Mob switches to Hurt/Flinch reaction frame
        setMobAnimState("hurt");

        // Slash Frame 2: Explosive burst shockwave
        const t3 = setTimeout(() => {
          setSlashAnimState("burst");
        }, COMBAT_CONFIG.SPRITE_ANIMATION.SLASH_FX_FRAME_MS);

        // End Slash FX
        const t4 = setTimeout(() => {
          setSlashAnimState("none");
        }, COMBAT_CONFIG.SPRITE_ANIMATION.SLASH_FX_FRAME_MS * 2.5);

        // Mob recovers from hurt flinch back to idle stance
        const t5 = setTimeout(() => {
          setMobAnimState("idle");
        }, COMBAT_CONFIG.SPRITE_ANIMATION.HURT_FRAME_MS);

        timeoutsRef.current.push(t3, t4, t5);
      }, 190);

      timeoutsRef.current.push(t1, t2);

      // ─── TRANSLATION & RECOIL SEQUENCING ───
      Animated.sequence([
        // Wind-up: pull back slightly
        Animated.parallel([
          Animated.timing(heroTranslateX, {
            toValue: -10,
            duration: 70,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(heroScale, {
            toValue: 0.95,
            duration: 70,
            useNativeDriver: true,
          }),
        ]),
        // Forward Dash & Lunge
        Animated.parallel([
          Animated.timing(heroTranslateX, {
            toValue: 100,
            duration: 130,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(heroScale, {
            toValue: 1.25,
            duration: 130,
            useNativeDriver: true,
          }),
          Animated.timing(heroRotate, {
            toValue: 1,
            duration: 130,
            useNativeDriver: true,
          }),
        ]),
        // Impact moment: Slash FX burst & Mob recoils
        Animated.parallel([
          Animated.sequence([
            Animated.timing(slashOpacity, { toValue: 1, duration: 40, useNativeDriver: true }),
            Animated.timing(slashScale, { toValue: 1.5, duration: 160, useNativeDriver: true }),
            Animated.timing(slashOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]),
          Animated.timing(slashRotate, { toValue: 1, duration: 250, useNativeDriver: true }),
          // Mob hit recoil & white flash
          Animated.sequence([
            Animated.parallel([
              Animated.timing(mobTranslateX, { toValue: 24, duration: 55, useNativeDriver: true }),
              Animated.timing(mobFlashOpacity, { toValue: 0.9, duration: 55, useNativeDriver: true }),
              Animated.timing(mobScale, { toValue: 0.88, duration: 55, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(mobTranslateX, { toValue: -8, duration: 75, useNativeDriver: true }),
              Animated.timing(mobFlashOpacity, { toValue: 0, duration: 110, useNativeDriver: true }),
            ]),
            Animated.timing(mobTranslateX, { toValue: 0, duration: 110, useNativeDriver: true }),
            Animated.timing(mobScale, { toValue: 1, duration: 110, useNativeDriver: true }),
          ]),
        ]),
        // Spring back to origin stance
        Animated.parallel([
          Animated.spring(heroTranslateX, {
            toValue: 0,
            friction: 4.5,
            tension: 85,
            useNativeDriver: true,
          }),
          Animated.spring(heroScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(heroRotate, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        slashScale.setValue(0.4);
        slashRotate.setValue(0);
        setHeroAnimState("idle");
        setAnimatingStrike(false);
      });

      // Clear popup after duration
      const tPop = setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== newPopup.id));
      }, 1700);
      timeoutsRef.current.push(tPop);
    },
    [
      heroTranslateX,
      heroScale,
      heroRotate,
      slashOpacity,
      slashScale,
      slashRotate,
      mobTranslateX,
      mobFlashOpacity,
      mobScale,
      stageShakeX,
      coinTranslateY,
      coinOpacity,
      activeTier,
    ]
  );

  const handleQuickStrikeAction = async (amount: number, label: string, catId?: string) => {
    if (animatingStrike || isStriking) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    const res = await onExecuteSavingsStrike(amount, label, catId);
    if (res) {
      playAttackAnimation(res, label);
    } else {
      playAttackAnimation(undefined, label);
    }
  };

  const hpPercent = Math.max(
    0,
    Math.min(100, Math.round((boss.current_hp / boss.max_hp) * 100))
  );

  const isBossDefeated = boss.current_hp <= 0;

  // Frame Sprite Selectors based on dynamic animation states
  const getHeroSprite = () => {
    switch (heroAnimState) {
      case "windup":
        return SPRITE_HERO_ATTACK_1;
      case "slash":
        return SPRITE_HERO_ATTACK_2;
      case "idle":
      default:
        return SPRITE_HERO_IDLE;
    }
  };

  const getMobTheme = () => {
    switch (activeTier) {
      case "daily":
        return {
          idleSprite: SPRITE_DAILY_IMP_IDLE,
          hurtSprite: SPRITE_DAILY_IMP_HURT,
          badge: "DAILY IMPULSE MOB",
          color: THEME_CONFIG.COLORS.TIER.DAILY,
          glow: `${THEME_CONFIG.COLORS.TIER.DAILY}30`,
          slogan: "Imp of Impulsive Buys",
          subtitle: "Strikes whenever you skip unnecessary buys",
        };
      case "weekly":
        return {
          idleSprite: SPRITE_WEEKLY_PHANTOM_IDLE,
          hurtSprite: SPRITE_WEEKLY_PHANTOM_HURT,
          badge: "WEEKLY SUBSCRIPTION PHANTOM",
          color: THEME_CONFIG.COLORS.TIER.WEEKLY,
          glow: `${THEME_CONFIG.COLORS.TIER.WEEKLY}30`,
          slogan: "Phantom of Hidden Subscriptions",
          subtitle: "Resist recurring money-draining temptations",
        };
      case "monthly":
        return {
          idleSprite: SPRITE_MONTHLY_TITAN_IDLE,
          hurtSprite: SPRITE_MONTHLY_TITAN_HURT,
          badge: "MONTHLY INFLATION TITAN",
          color: THEME_CONFIG.COLORS.TIER.MONTHLY,
          glow: `${THEME_CONFIG.COLORS.TIER.MONTHLY}30`,
          slogan: "Titan of Lifestyle Inflation",
          subtitle: "Heavy boss requiring persistent self-control",
        };
    }
  };

  const mobTheme = getMobTheme();
  const currentMobSprite = mobAnimState === "hurt" ? mobTheme.hurtSprite : mobTheme.idleSprite;

  const getSlashSprite = () => {
    switch (slashAnimState) {
      case "crescent":
        return SPRITE_SLASH_CRESCENT;
      case "burst":
        return SPRITE_SLASH_BURST;
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={{ transform: [{ translateX: stageShakeX }] }}
      className={`rounded-3xl p-4 border shadow-sm mb-4 overflow-hidden relative ${
        isDark ? "bg-[#141517] border-[#303336]" : "bg-white border-[#E7E1DE]"
      }`}
    >
      {/* ─── ARENA HEADER & TIER TABS ─── */}
      <View className="flex-row items-center justify-between mb-3.5">
        <View className="flex-row items-center gap-2">
          <View
            style={{ backgroundColor: THEME_CONFIG.COLORS.BRAND }}
            className="h-7 w-7 rounded-lg items-center justify-center shadow-xs"
          >
            <MaterialIcons name="sports-kabaddi" size={16} color="white" />
          </View>
          <Text
            style={{ color: THEME_CONFIG.COLORS.BRAND }}
            className="text-xs font-black uppercase tracking-wider"
          >
            Self-Control Battle Arena
          </Text>
        </View>

        <View
          style={{
            backgroundColor: THEME_CONFIG.COLORS.BRAND_TINT_15,
            borderColor: THEME_CONFIG.COLORS.BRAND_TINT_30,
          }}
          className="flex-row items-center gap-1 px-2.5 py-1 rounded-full border"
        >
          <MaterialIcons name="shield" size={12} color={THEME_CONFIG.COLORS.BRAND} />
          <Text
            style={{ color: THEME_CONFIG.COLORS.BRAND }}
            className="text-[10px] font-black"
          >
            {profile?.current_streak ?? 1}x Multiplier
          </Text>
        </View>
      </View>

      {/* Tier Switcher Segment */}
      <View
        className={`flex-row p-1 rounded-2xl border mb-3.5 ${
          isDark ? "bg-[#0B0C0E] border-[#26282B]" : "bg-stone-100 border-[#E7E1DE]"
        }`}
      >
        {(["daily", "weekly", "monthly"] as const).map((tier) => {
          const isSelected = activeTier === tier;
          const label =
            tier === "daily" ? "Daily Mob" : tier === "weekly" ? "Weekly Phantom" : "Monthly Titan";
          return (
            <Pressable
              key={tier}
              onPress={() => onSelectTier(tier)}
              style={isSelected ? { backgroundColor: THEME_CONFIG.COLORS.BRAND } : undefined}
              className={`flex-1 py-2 rounded-xl items-center justify-center transition-colors ${
                isSelected ? "shadow-xs" : ""
              }`}
            >
              <Text
                className={`text-xs font-black ${
                  isSelected ? "text-white" : isDark ? "text-stone-400" : "text-stone-600"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ─── 2D BATTLEFIELD STAGE ─── */}
      <View
        className={`h-72 rounded-2xl border relative overflow-hidden justify-between p-4 ${
          isDark ? "bg-[#0A0B0D] border-[#222428]" : "bg-[#FAF7F5] border-[#E7E1DE]"
        }`}
      >
        {/* Background Ambient Aura */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none" className="opacity-25">
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="arenaGlow" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor={mobTheme.color} stopOpacity="0.35" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Circle cx="50%" cy="50%" r="120" fill="url(#arenaGlow)" />
          </Svg>
        </View>

        {/* Top Battle HUD: Monster Info & HP Status */}
        <View className="flex-row items-start justify-between z-10">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text
                className={`text-sm font-black tracking-tight ${
                  isDark ? "text-white" : "text-stone-900"
                }`}
              >
                {boss.name}
              </Text>
              <View
                style={{
                  borderColor: `${mobTheme.color}50`,
                  backgroundColor: `${mobTheme.color}20`,
                }}
                className="px-2 py-0.5 rounded-full border"
              >
                <Text
                  style={{ color: mobTheme.color }}
                  className="text-[9px] font-black tracking-wider"
                >
                  {boss.tier.toUpperCase()} BOSS
                </Text>
              </View>
            </View>
            <Text
              className={`text-[10px] font-semibold mt-1 ${
                isDark ? "text-stone-400" : "text-stone-500"
              }`}
            >
              Loot: +{boss.gold_reward} Gold • +{boss.exp_reward} EXP • +{boss.trk_reward} TRK
            </Text>
          </View>

          <View
            className={`items-end px-2.5 py-1 rounded-xl border ${
              isDark ? "bg-black/60 border-white/10" : "bg-white/80 border-stone-200"
            }`}
          >
            <Text
              style={{
                color: isBossDefeated ? THEME_CONFIG.COLORS.SUCCESS : mobTheme.color,
              }}
              className="text-xs font-black tabular-nums"
            >
              {boss.current_hp} / {boss.max_hp} HP
            </Text>
            <Text
              className={`text-[9px] font-bold mt-0.5 ${
                isBossDefeated
                  ? "text-emerald-500"
                  : isDark
                  ? "text-stone-400"
                  : "text-stone-500"
              }`}
            >
              {isBossDefeated ? "DEFEATED" : `${hpPercent}% Health`}
            </Text>
          </View>
        </View>

        {/* ─── LIVE COMBATANTS LAYER (HERO VS MOB WITH FRAME-BY-FRAME SPRITES) ─── */}
        <View className="flex-1 flex-row items-center justify-between px-6 z-10 relative">
          {/* 1. HERO CHARACTER (ANIMATED SPRITE FRAMES) */}
          <Animated.View
            style={{
              transform: [
                { translateX: heroTranslateX },
                { translateY: heroTranslateY },
                { scale: heroScale },
                {
                  rotate: heroRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "12deg"],
                  }),
                },
              ],
            }}
            className="items-center"
          >
            <View className="relative items-center justify-center">
              {/* Dynamic Sprite Frame */}
              <View
                style={{ borderColor: THEME_CONFIG.COLORS.BRAND }}
                className="w-20 h-20 rounded-2xl overflow-hidden border-2 shadow-lg bg-stone-900 items-center justify-center"
              >
                <Image
                  source={getHeroSprite()}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>

              {/* Action State Indicator Spark */}
              <View
                style={{ backgroundColor: THEME_CONFIG.COLORS.BRAND }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full border border-white items-center justify-center shadow-md"
              >
                <MaterialIcons
                  name={heroAnimState === "slash" ? "flash-on" : heroAnimState === "windup" ? "shield" : "offline-bolt"}
                  size={11}
                  color="white"
                />
              </View>

              {/* Battle Pedestal Base Shadow */}
              <View
                style={{ backgroundColor: THEME_CONFIG.COLORS.BRAND_TINT_40 }}
                className="w-16 h-2 rounded-full mt-1.5 self-center"
              />
            </View>

            <View className="mt-1 bg-black/75 px-2.5 py-0.5 rounded-full border border-white/10">
              <Text className="text-[10px] font-black text-white">
                {profile?.partner_name ? "Hero Hunter" : "Player (You)"}
              </Text>
            </View>
          </Animated.View>

          {/* 2. CENTER SLASH IMPACT SPRITE (FRAME-BY-FRAME) & COIN PARTICLES */}
          {slashAnimState !== "none" && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                right: 38,
                top: "16%",
                opacity: slashOpacity,
                transform: [
                  { scale: slashScale },
                  {
                    rotate: slashRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-25deg", "35deg"],
                    }),
                  },
                ],
              }}
              className="w-32 h-32 z-30 items-center justify-center rounded-2xl overflow-hidden"
            >
              <Image
                source={getSlashSprite()!}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            </Animated.View>
          )}

          {/* Floating Coin Burst Particles */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: 60,
              top: "25%",
              opacity: coinOpacity,
              transform: [{ translateY: coinTranslateY }],
            }}
            className="z-30 items-center flex-row gap-1"
          >
            <MaterialIcons name="monetization-on" size={18} color="#F1B64A" />
            <Text className="text-xs font-black text-amber-300 shadow-md">+💰</Text>
          </Animated.View>

          {/* 3. MOB / IMPULSE BOSS SPRITE (IDLE VS HURT FRAME) */}
          <Animated.View
            style={{
              transform: [
                { translateX: mobTranslateX },
                { translateY: mobTranslateY },
                { scale: mobScale },
              ],
            }}
            className="items-center"
          >
            <View className="relative items-center justify-center">
              {/* Monster Frame with Dynamic Sprite Swap */}
              <View
                style={{
                  borderColor: mobAnimState === "hurt" ? THEME_CONFIG.COLORS.ERROR : mobTheme.color,
                }}
                className={`w-22 h-22 rounded-2xl overflow-hidden border-2 shadow-lg bg-stone-950 items-center justify-center ${
                  isBossDefeated ? "opacity-35" : "opacity-100"
                }`}
              >
                <Image
                  source={currentMobSprite}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>

              {/* Hit Flash Overlay */}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "#FFFFFF",
                  opacity: mobFlashOpacity,
                  borderRadius: 16,
                }}
              />

              {/* Battle Pedestal Base Shadow */}
              <View
                style={{ backgroundColor: mobTheme.glow }}
                className="w-18 h-2 rounded-full mt-1.5 self-center"
              />
            </View>

            <View className="mt-1 bg-black/75 px-2.5 py-0.5 rounded-full border border-white/10">
              <Text className="text-[10px] font-black text-white" numberOfLines={1}>
                {boss.title}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* 4. DEFEATED BANNER */}
        {isBossDefeated && (
          <View
            pointerEvents="none"
            className="absolute inset-x-0 top-[46%] items-center z-25 px-4"
          >
            <View className="bg-black/90 px-4 py-2 rounded-2xl border-2 border-emerald-400 items-center shadow-2xl">
              <View className="flex-row items-center gap-1.5">
                <MaterialIcons name="emoji-events" size={18} color="#34D399" />
                <Text className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                  VICTORY! BOSS CLEARED
                </Text>
              </View>
              <Text className="text-[9px] font-bold text-stone-300 mt-0.5">
                +{boss.gold_reward} Gold • +{boss.exp_reward} EXP Collected
              </Text>
            </View>
          </View>
        )}

        {/* 5. FLOATING COMBAT DAMAGE NUMBERS */}
        {popups.map((popup) => (
          <Animated.View
            key={popup.id}
            pointerEvents="none"
            style={{
              transform: [{ translateY: popup.animY }],
              opacity: popup.animOpacity,
            }}
            className="absolute top-10 left-0 right-0 items-center z-30"
          >
            <View
              style={{ borderColor: popup.isCrit ? "#FF3B30" : THEME_CONFIG.COLORS.BRAND }}
              className="bg-black/95 px-3.5 py-1.5 rounded-xl border shadow-2xl items-center"
            >
              <Text
                className={`font-black text-sm ${
                  popup.isCrit ? "text-[#FF3B30] text-base" : "text-amber-400"
                }`}
              >
                {popup.damageText}
              </Text>
              {popup.lootText ? (
                <Text className="text-[10px] font-black text-emerald-400 mt-0.5">
                  {popup.lootText}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        ))}

        {/* 6. BOTTOM HEALTH BAR HUD */}
        <View className="w-full z-10 pt-1">
          <View className="flex-row items-center justify-between mb-1 px-0.5">
            <View className="flex-row items-center gap-1">
              <MaterialIcons
                name="favorite"
                size={11}
                color={hpPercent > 20 ? mobTheme.color : THEME_CONFIG.COLORS.ERROR}
              />
              <Text className="text-[9px] font-black tracking-wider text-stone-400">
                BOSS HEALTH
              </Text>
            </View>
            <Text className="text-[9px] font-black tabular-nums text-stone-300">
              {hpPercent}%
            </Text>
          </View>
          <View
            className={`h-2.5 w-full rounded-full border overflow-hidden p-0.5 ${
              isDark ? "bg-stone-900 border-stone-800" : "bg-stone-200 border-stone-300"
            }`}
          >
            <View
              style={{
                width: `${hpPercent}%`,
                backgroundColor: hpPercent > 20 ? mobTheme.color : THEME_CONFIG.COLORS.ERROR,
                height: "100%",
                borderRadius: 999,
              }}
            />
          </View>
        </View>
      </View>

      {/* ─── QUICK SAVINGS STRIKE ACTION PRESETS ─── */}
      <View className="mt-4">
        <View className="flex-row items-center justify-between mb-2.5 px-0.5">
          <Text
            className={`text-[10px] font-black uppercase tracking-wider ${
              isDark ? "text-stone-400" : "text-stone-600"
            }`}
          >
            ⚡ Instant Savings Strikes (₱ Saved = Damage)
          </Text>
        </View>

        <View className="flex-row gap-2.5">
          {COMBAT_CONFIG.QUICK_STRIKES.map((strike) => (
            <Pressable
              key={strike.amount}
              disabled={animatingStrike}
              onPress={() => handleQuickStrikeAction(strike.amount, strike.label)}
              className={`flex-1 py-3 px-2 rounded-2xl border items-center justify-center active:scale-95 transition-transform ${
                isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-[#E7E1DE]"
              }`}
            >
              <View
                style={{ backgroundColor: THEME_CONFIG.COLORS.BRAND_TINT_15 }}
                className="h-8 w-8 rounded-xl items-center justify-center mb-1"
              >
                <MaterialCommunityIcons
                  name={strike.icon as any}
                  size={16}
                  color={THEME_CONFIG.COLORS.BRAND}
                />
              </View>
              <Text
                style={{ color: THEME_CONFIG.COLORS.BRAND }}
                className="text-xs font-black"
              >
                {strike.title}
              </Text>
              <Text
                className={`text-[9px] font-semibold mt-0.5 text-center ${
                  isDark ? "text-stone-400" : "text-stone-500"
                }`}
                numberOfLines={1}
              >
                {strike.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
