import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Image,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Svg, { Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import { BossEncounter, CombatStrikeResult, PlayerProfile } from "@/src/types";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { THEME_CONFIG } from "@/src/constants/theme";
import { COMBAT_CONFIG } from "@/src/constants/combat";
import { useCombatAnimationController } from "./useCombatAnimationController";

// ─── 16-BIT JRPG PIXEL ART TRANSPARENT FRAME SEQUENCES ───
// Hero Idle Animation (4 frames in continuous breathing loop)
const HERO_IDLE_FRAMES = [
  require("@/assets/images/sprites/hero_idle_0.png"),
  require("@/assets/images/sprites/hero_idle_1.png"),
  require("@/assets/images/sprites/hero_idle_2.png"),
  require("@/assets/images/sprites/hero_idle_3.png"),
];
// Hero Attack Animation Frames
const HERO_ATTACK_WINDUP = require("@/assets/images/sprites/hero_attack_0.png");
const HERO_ATTACK_SLASH = require("@/assets/images/sprites/hero_attack_1.png");

// Boss Encounter Frames (Idle breathing loop + Hurt recoil reaction)
const MOB_FRAMES = {
  daily: {
    idle: [
      require("@/assets/images/sprites/daily_imp_idle_0.png"),
      require("@/assets/images/sprites/daily_imp_idle_1.png"),
    ],
    hurt: require("@/assets/images/sprites/daily_imp_hurt.png"),
  },
  weekly: {
    idle: [
      require("@/assets/images/sprites/phantom_idle_0.png"),
      require("@/assets/images/sprites/phantom_idle_1.png"),
    ],
    hurt: require("@/assets/images/sprites/phantom_hurt.png"),
  },
  monthly: {
    idle: [
      require("@/assets/images/sprites/titan_idle_0.png"),
      require("@/assets/images/sprites/titan_idle_1.png"),
    ],
    hurt: require("@/assets/images/sprites/titan_hurt.png"),
  },
};

// Combat Visual FX Frames
const SPRITE_SLASH_CRESCENT = require("@/assets/images/sprites/slash_crescent.png");
const SPRITE_SLASH_BURST = require("@/assets/images/sprites/slash_burst.png");

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

export default function BattlefieldArena({
  boss,
  profile,
  activeTier,
  onSelectTier,
  onExecuteSavingsStrike,
  isStriking = false,
}: BattlefieldArenaProps) {
  const isDark = useColorScheme() === "dark";

  // Event-Driven 60 FPS Combat Animation Controller
  const {
    playerState,
    targetState,
    slashState,
    comboCount,
    popups,
    playerTranslateX,
    playerTranslateY,
    playerScale,
    playerRotate,
    targetTranslateX,
    targetTranslateY,
    targetScale,
    targetFlashOpacity,
    slashOpacity,
    slashScale,
    slashRotate,
    coinTranslateY,
    coinOpacity,
    stageShakeX,
  } = useCombatAnimationController({
    activeTier,
  });

  // ─── ACTIVE FRAME INDEXES FOR CONTINUOUS FRAME-BY-FRAME ANIMATION ───
  const [heroIdleFrameIndex, setHeroIdleFrameIndex] = useState(0);
  const [mobIdleFrameIndex, setMobIdleFrameIndex] = useState(0);

  // Hero Idle Frame Loop (4-frame cycle at retro FPS)
  useEffect(() => {
    if (playerState !== "IDLE") return;
    const interval = setInterval(() => {
      setHeroIdleFrameIndex((prev) => (prev + 1) % HERO_IDLE_FRAMES.length);
    }, COMBAT_CONFIG.SPRITE_ANIMATION.IDLE_FRAME_MS);
    return () => clearInterval(interval);
  }, [playerState]);

  // Mob Idle Frame Loop (2-frame cycle)
  useEffect(() => {
    if (targetState !== "IDLE") return;
    const interval = setInterval(() => {
      setMobIdleFrameIndex((prev) => (prev + 1) % 2);
    }, COMBAT_CONFIG.SPRITE_ANIMATION.IDLE_FRAME_MS * 2);
    return () => clearInterval(interval);
  }, [targetState]);

  const hpPercent = Math.max(
    0,
    Math.min(100, Math.round((boss.current_hp / boss.max_hp) * 100))
  );

  const isBossDefeated = boss.current_hp <= 0;

  // Frame Sprite Selectors
  const getHeroSprite = () => {
    switch (playerState) {
      case "WINDUP":
        return HERO_ATTACK_WINDUP;
      case "STRIKE":
      case "FOLLOW_THROUGH":
        return HERO_ATTACK_SLASH;
      case "IDLE":
      default:
        return HERO_IDLE_FRAMES[heroIdleFrameIndex] || HERO_IDLE_FRAMES[0];
    }
  };

  const getMobTheme = () => {
    switch (activeTier) {
      case "daily":
        return {
          frames: MOB_FRAMES.daily,
          badge: "DAILY IMPULSE MOB",
          color: THEME_CONFIG.COLORS.TIER.DAILY,
          glow: `${THEME_CONFIG.COLORS.TIER.DAILY}30`,
          slogan: "Imp of Impulsive Buys",
          subtitle: "Strikes whenever you skip unnecessary buys",
        };
      case "weekly":
        return {
          frames: MOB_FRAMES.weekly,
          badge: "WEEKLY SUBSCRIPTION PHANTOM",
          color: THEME_CONFIG.COLORS.TIER.WEEKLY,
          glow: `${THEME_CONFIG.COLORS.TIER.WEEKLY}30`,
          slogan: "Phantom of Hidden Subscriptions",
          subtitle: "Resist recurring money-draining temptations",
        };
      case "monthly":
        return {
          frames: MOB_FRAMES.monthly,
          badge: "MONTHLY INFLATION TITAN",
          color: THEME_CONFIG.COLORS.TIER.MONTHLY,
          glow: `${THEME_CONFIG.COLORS.TIER.MONTHLY}30`,
          slogan: "Titan of Lifestyle Inflation",
          subtitle: "Heavy boss requiring persistent self-control",
        };
    }
  };

  const mobTheme = getMobTheme();
  const currentMobSprite =
    targetState === "HURT" || targetState === "HIT_STUN"
      ? mobTheme.frames.hurt
      : mobTheme.frames.idle[mobIdleFrameIndex] || mobTheme.frames.idle[0];

  const getSlashSprite = () => {
    switch (slashState) {
      case "CRESCENT":
        return SPRITE_SLASH_CRESCENT;
      case "BURST":
        return SPRITE_SLASH_BURST;
      default:
        return null;
    }
  };

  const handleQuickStrikeAction = async (amount: number, label: string, catId?: string) => {
    await onExecuteSavingsStrike(amount, label, catId);
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

        <View className="flex-row items-center gap-2">
          {/* Active Combo Multiplier Pill */}
          {comboCount > 1 && (
            <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40">
              <MaterialIcons name="local-fire-department" size={12} color="#F59E0B" />
              <Text className="text-[10px] font-black text-amber-500">
                {comboCount}x COMBO
              </Text>
            </View>
          )}

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

      {/* ─── 2D BATTLEFIELD STAGE VIEWPORT ─── */}
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

        {/* ─── LIVE COMBATANTS LAYER (HERO VS MOB WITH TRANSPARENT FRAME-BY-FRAME SPRITES) ─── */}
        <View className="flex-1 flex-row items-center justify-between px-6 z-10 relative">
          {/* 1. HERO CHARACTER (LEFT SIDE) */}
          <Animated.View
            style={{
              transform: [
                { translateX: playerTranslateX },
                { translateY: playerTranslateY },
                { scale: playerScale },
                {
                  rotate: playerRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "12deg"],
                  }),
                },
              ],
            }}
            className="items-center"
          >
            <View className="relative items-center justify-end w-28 h-28">
              {/* Unboxed Transparent Sprite with Frame-by-Frame Action */}
              <Image
                source={getHeroSprite()}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />

              {/* Ground Shadow Pedestal */}
              <View
                style={{ backgroundColor: THEME_CONFIG.COLORS.BRAND_TINT_30 }}
                className="w-16 h-2 rounded-full -mt-1 self-center"
              />
            </View>

            <View className="mt-1 bg-black/75 px-2.5 py-0.5 rounded-full border border-white/10">
              <Text className="text-[10px] font-black text-white">
                {profile?.partner_name ? "Hero Hunter" : "Player (You)"}
              </Text>
            </View>
          </Animated.View>

          {/* 2. CENTER SLASH IMPACT SPRITE & COIN PARTICLES */}
          {slashState !== "NONE" && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                right: 32,
                top: "14%",
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
              className="w-36 h-36 z-30 items-center justify-center pointer-events-none"
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

          {/* 3. MOB / TARGET SPRITE (RIGHT SIDE) */}
          <Animated.View
            style={{
              transform: [
                { translateX: targetTranslateX },
                { translateY: targetTranslateY },
                { scale: targetScale },
              ],
            }}
            className="items-center"
          >
            <View className="relative items-center justify-end w-28 h-28">
              {/* Unboxed Transparent Mob with Frame-by-Frame Action */}
              <Image
                source={currentMobSprite}
                style={{
                  width: "100%",
                  height: "100%",
                  opacity: isBossDefeated ? 0.35 : 1.0,
                }}
                resizeMode="contain"
              />

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
                  opacity: targetFlashOpacity,
                  borderRadius: 20,
                }}
              />

              {/* Ground Shadow Pedestal */}
              <View
                style={{ backgroundColor: mobTheme.glow }}
                className="w-18 h-2 rounded-full -mt-1 self-center"
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
              disabled={isStriking}
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
