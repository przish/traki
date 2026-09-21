import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import { BossEncounter, CombatStrikeResult, PlayerProfile } from "@/src/types";
import { useColorScheme } from "@/hooks/use-color-scheme";

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

  // Animation values
  const heroTranslateX = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(1)).current;

  const mobTranslateX = useRef(new Animated.Value(0)).current;
  const mobTranslateY = useRef(new Animated.Value(0)).current;
  const mobScale = useRef(new Animated.Value(1)).current;
  const mobFlashOpacity = useRef(new Animated.Value(0)).current;

  const slashOpacity = useRef(new Animated.Value(0)).current;
  const slashScale = useRef(new Animated.Value(0.5)).current;
  const slashRotate = useRef(new Animated.Value(0)).current;

  const stageShakeX = useRef(new Animated.Value(0)).current;
  const hpCleaveAnim = useRef(new Animated.Value(boss.current_hp)).current;

  const [popups, setPopups] = useState<FloatingPopup[]>([]);
  const [animatingStrike, setAnimatingStrike] = useState(false);

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
          toValue: -8,
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

  // Trigger full attack animation sequence
  const playAttackAnimation = useCallback(
    (strikeResult?: CombatStrikeResult, customLabel?: string) => {
      setAnimatingStrike(true);

      const isCrit = strikeResult?.isCrit ?? false;
      const dmg = strikeResult?.totalDamage ?? 100;
      const gold = strikeResult?.goldEarned ?? Math.round(dmg * 0.5);
      const exp = strikeResult?.expEarned ?? Math.round(dmg * 0.25);
      const trk = activeTier === "daily" ? 2 : activeTier === "weekly" ? 15 : 50;

      // Add floating popup
      const newPopup: FloatingPopup = {
        id: `pop_${Date.now()}_${Math.random()}`,
        damageText: isCrit ? `🔥 CRIT! -${dmg} HP` : `⚔️ -${dmg} HP`,
        lootText: `+${gold} Gold • +${exp} EXP • +${trk} TRK`,
        isCrit,
      };
      setPopups((prev) => [...prev.slice(-2), newPopup]);

      // Stage camera shake
      Animated.sequence([
        Animated.timing(stageShakeX, { toValue: -6, duration: 40, useNativeDriver: true }),
        Animated.timing(stageShakeX, { toValue: 6, duration: 40, useNativeDriver: true }),
        Animated.timing(stageShakeX, { toValue: -3, duration: 40, useNativeDriver: true }),
        Animated.timing(stageShakeX, { toValue: 3, duration: 40, useNativeDriver: true }),
        Animated.timing(stageShakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();

      // Hero Rush & Strike
      Animated.sequence([
        // 1. Dash Forward to Mob
        Animated.parallel([
          Animated.timing(heroTranslateX, {
            toValue: 90,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(heroScale, {
            toValue: 1.25,
            duration: 140,
            useNativeDriver: true,
          }),
        ]),
        // 2. Slash FX burst
        Animated.parallel([
          Animated.sequence([
            Animated.timing(slashOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
            Animated.timing(slashScale, { toValue: 1.4, duration: 160, useNativeDriver: true }),
            Animated.timing(slashOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
          ]),
          Animated.timing(slashRotate, { toValue: 1, duration: 250, useNativeDriver: true }),
          // Mob hit recoil & red flash
          Animated.sequence([
            Animated.parallel([
              Animated.timing(mobTranslateX, { toValue: 24, duration: 60, useNativeDriver: true }),
              Animated.timing(mobFlashOpacity, { toValue: 0.8, duration: 60, useNativeDriver: true }),
              Animated.timing(mobScale, { toValue: 0.9, duration: 60, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(mobTranslateX, { toValue: -8, duration: 80, useNativeDriver: true }),
              Animated.timing(mobFlashOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
            ]),
            Animated.timing(mobTranslateX, { toValue: 0, duration: 120, useNativeDriver: true }),
            Animated.timing(mobScale, { toValue: 1, duration: 120, useNativeDriver: true }),
          ]),
        ]),
        // 3. Hero Spring Back to Origin Stance
        Animated.parallel([
          Animated.spring(heroTranslateX, {
            toValue: 0,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.spring(heroScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        slashScale.setValue(0.5);
        slashRotate.setValue(0);
        setAnimatingStrike(false);
      });

      // Clear popup after duration
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== newPopup.id));
      }, 1600);
    },
    [
      heroTranslateX,
      heroScale,
      slashOpacity,
      slashScale,
      slashRotate,
      mobTranslateX,
      mobFlashOpacity,
      mobScale,
      stageShakeX,
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

  // Mob visuals configuration per tier
  const getMobTheme = () => {
    switch (activeTier) {
      case "daily":
        return {
          icon: "bug-outline",
          badge: "DAILY IMPULSE MOB",
          color: "#AF2219",
          glow: "#AF221940",
          slogan: "Imp of Impulsive Spending",
          subtitle: "Strikes whenever you skip unnecessary buys",
        };
      case "weekly":
        return {
          icon: "ghost",
          badge: "WEEKLY SUBSCRIPTION PHANTOM",
          color: "#7C3AED",
          glow: "#7C3AED40",
          slogan: "Phantom of Hidden Subscriptions",
          subtitle: "Resist recurring money-draining temptations",
        };
      case "monthly":
        return {
          icon: "skull-scan-outline",
          badge: "MONTHLY INFLATION TITAN",
          color: "#D97706",
          glow: "#D9770640",
          slogan: "Titan of Lifestyle Inflation",
          subtitle: "Heavy boss requiring persistent self-control",
        };
    }
  };

  const mobTheme = getMobTheme();

  return (
    <Animated.View
      style={{ transform: [{ translateX: stageShakeX }] }}
      className={`rounded-3xl p-4 border shadow-md mb-4 overflow-hidden relative ${
        isDark ? "bg-[#141517] border-[#303336]" : "bg-white border-stone-200"
      }`}
    >
      {/* ─── ARENA HEADER & TIER TABS ─── */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 rounded-lg bg-[#AF2219] items-center justify-center">
            <MaterialIcons name="sports-kabaddi" size={14} color="white" />
          </View>
          <Text className="text-[11px] font-black uppercase tracking-wider text-[#AF2219]">
            Self-Control Battle Arena
          </Text>
        </View>

        <View className="flex-row items-center gap-1 bg-[#AF221915] px-2.5 py-0.5 rounded-full border border-[#AF221930]">
          <MaterialIcons name="shield" size={12} color="#AF2219" />
          <Text className="text-[10px] font-black text-[#AF2219]">
            {profile?.current_streak ?? 1}x Streak Multiplier
          </Text>
        </View>
      </View>

      {/* Tier Switcher Segment */}
      <View
        className={`flex-row p-1 rounded-xl border mb-3.5 ${
          isDark ? "bg-[#0B0C0E] border-[#26282B]" : "bg-stone-100 border-stone-200"
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
              className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                isSelected ? "bg-[#AF2219] shadow-xs" : ""
              }`}
            >
              <Text
                className={`text-[11px] font-black ${
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
        className={`h-56 rounded-2xl border relative overflow-hidden justify-between p-3 ${
          isDark ? "bg-[#0A0B0D] border-[#222428]" : "bg-[#FAF7F5] border-stone-200"
        }`}
      >
        {/* Background Grid & Arena Lighting */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none" className="opacity-20">
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="arenaGlow" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#AF2219" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Circle cx="50%" cy="50%" r="90" fill="url(#arenaGlow)" />
          </Svg>
        </View>

        {/* Top Battle HUD: Monster Name & Rewards */}
        <View className="flex-row items-center justify-between z-10">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center gap-1.5">
              <Text className={`text-sm font-black tracking-tight ${isDark ? "text-white" : "text-stone-900"}`}>
                {boss.name}
              </Text>
              <View className="bg-[#AF221920] px-1.5 py-0.2 rounded border border-[#AF221940]">
                <Text className="text-[9px] font-black text-[#AF2219]">
                  {boss.tier.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text className={`text-[10px] font-semibold mt-0.5 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
              Loot: +{boss.gold_reward} Gold • +{boss.exp_reward} EXP • +{boss.trk_reward} TRK
            </Text>
          </View>

          <View className="items-end">
            <Text className="text-xs font-black text-[#AF2219] tabular-nums">
              {boss.current_hp} / {boss.max_hp} HP
            </Text>
            <Text className={`text-[9px] font-bold ${isDark ? "text-stone-500" : "text-stone-400"}`}>
              {hpPercent}% Health
            </Text>
          </View>
        </View>

        {/* ─── LIVE COMBATANTS LAYER (HERO VS MOB) ─── */}
        <View className="flex-1 flex-row items-center justify-between px-4 z-10">
          {/* 1. HERO CHARACTER (Player) */}
          <Animated.View
            style={{
              transform: [
                { translateX: heroTranslateX },
                { translateY: heroTranslateY },
                { scale: heroScale },
              ],
            }}
            className="items-center"
          >
            {/* Hero Character Visual */}
            <View className="relative items-center justify-center">
              {/* Knight Shield / Aura */}
              <View className="w-16 h-16 rounded-2xl bg-[#AF221918] border-2 border-[#AF2219] items-center justify-center shadow-lg">
                <MaterialCommunityIcons name="sword-cross" size={32} color="#AF2219" />
              </View>

              {/* Glowing Weapon / Spark Indicator */}
              <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#AF2219] border border-white items-center justify-center">
                <MaterialIcons name="flash-on" size={12} color="white" />
              </View>
            </View>

            <View className="mt-1 bg-black/60 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-black text-white">
                {profile?.partner_name ? "Hero Hunter" : "Player (You)"}
              </Text>
            </View>
          </Animated.View>

          {/* 2. CENTER SLASH PARTICLES / FX LAYER */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: "48%",
              top: "22%",
              opacity: slashOpacity,
              transform: [
                { scale: slashScale },
                {
                  rotate: slashRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["-35deg", "45deg"],
                  }),
                },
              ],
            }}
          >
            <Svg width={70} height={70} viewBox="0 0 100 100">
              <Path
                d="M 10,10 Q 90,30 85,85"
                stroke="#AF2219"
                strokeWidth={10}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M 20,5 Q 95,25 90,80"
                stroke="#FF4D4D"
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Animated.View>

          {/* 3. MOB / IMPULSE BOSS SPRITE */}
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
              {/* Monster Box with dynamic tier styling */}
              <View
                style={{ borderColor: mobTheme.color, backgroundColor: `${mobTheme.color}15` }}
                className="w-18 h-18 rounded-2xl border-2 items-center justify-center shadow-lg"
              >
                <MaterialCommunityIcons
                  name={mobTheme.icon as any}
                  size={36}
                  color={mobTheme.color}
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

              {/* Defeated Skull Overlay if zero HP */}
              {isBossDefeated && (
                <View className="absolute inset-0 bg-black/70 rounded-2xl items-center justify-center">
                  <MaterialIcons name="sentiment-very-dissatisfied" size={28} color="#AF2219" />
                  <Text className="text-[9px] font-black text-white uppercase">DEFEATED</Text>
                </View>
              )}
            </View>

            <View className="mt-1 bg-black/60 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-black text-white" numberOfLines={1}>
                {boss.title}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* ─── FLOATING COMBAT DAMAGE NUMBERS ─── */}
        {popups.map((popup) => (
          <View
            key={popup.id}
            pointerEvents="none"
            className="absolute top-12 left-0 right-0 items-center z-30"
          >
            <View className="bg-black/90 px-3.5 py-1.5 rounded-xl border border-[#AF2219] shadow-xl items-center">
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
          </View>
        ))}

        {/* ─── BOTTOM HEALTH BAR HUD ─── */}
        <View className="w-full z-10 pt-1">
          <View
            className={`h-3 w-full rounded-full border overflow-hidden p-0.5 ${
              isDark ? "bg-stone-900 border-stone-800" : "bg-stone-200 border-stone-300"
            }`}
          >
            <View
              style={{
                width: `${hpPercent}%`,
                backgroundColor: hpPercent > 20 ? "#AF2219" : "#DC2626",
                height: "100%",
                borderRadius: 999,
              }}
            />
          </View>
        </View>
      </View>

      {/* ─── QUICK SAVINGS STRIKE ACTION PRESETS ─── */}
      <View className="mt-3.5">
        <View className="flex-row items-center justify-between mb-2">
          <Text className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-stone-400" : "text-stone-600"}`}>
            ⚡ Instant Savings Strikes (₱ Saved = Damage Dealt)
          </Text>
        </View>

        <View className="flex-row gap-2">
          {/* Quick Preset 1: Coffee Resist */}
          <Pressable
            disabled={animatingStrike}
            onPress={() => handleQuickStrikeAction(50, "Passed Coffee / Snacks")}
            className={`flex-1 p-2.5 rounded-xl border items-center justify-center active:scale-95 transition-transform ${
              isDark ? "bg-[#1C1E21] border-[#303336]" : "bg-stone-50 border-stone-200"
            }`}
          >
            <Text className="text-xs font-black text-[#AF2219]">₱50 Strike</Text>
            <Text className={`text-[9px] font-semibold mt-0.5 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
              Coffee Pass
            </Text>
          </Pressable>

          {/* Quick Preset 2: Food Delivery Passed */}
          <Pressable
            disabled={animatingStrike}
            onPress={() => handleQuickStrikeAction(150, "Skipped Takeout / Delivery")}
            className={`flex-1 p-2.5 rounded-xl border items-center justify-center active:scale-95 transition-transform ${
              isDark ? "bg-[#1C1E21] border-[#303336]" : "bg-stone-50 border-stone-200"
            }`}
          >
            <Text className="text-xs font-black text-[#AF2219]">₱150 Strike</Text>
            <Text className={`text-[9px] font-semibold mt-0.5 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
              Takeout Pass
            </Text>
          </Pressable>

          {/* Quick Preset 3: Impulse Shopping Blocked */}
          <Pressable
            disabled={animatingStrike}
            onPress={() => handleQuickStrikeAction(500, "Resisted Impulse Online Buy")}
            className={`flex-1 p-2.5 rounded-xl border items-center justify-center active:scale-95 transition-transform ${
              isDark ? "bg-[#1C1E21] border-[#303336]" : "bg-stone-50 border-stone-200"
            }`}
          >
            <Text className="text-xs font-black text-[#AF2219]">₱500 Strike</Text>
            <Text className={`text-[9px] font-semibold mt-0.5 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
              Impulse Block
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
