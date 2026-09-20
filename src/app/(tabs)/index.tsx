import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Continue from "@/components/continue";
import PartnerCard from "@/components/PartnerCard";

export default function CombatScreen() {
  const isDark = useColorScheme() === "dark";
  const { profile, bosses, logTransaction, wallets, categories, refreshData } = useTraki();
  const [activeTier, setActiveTier] = useState<"daily" | "weekly" | "monthly">("daily");
  const [floatingDamage, setFloatingDamage] = useState<{ id: number; text: string; isCrit: boolean } | null>(null);

  const dailyBoss = bosses.find((b) => b.tier === "daily");
  const weeklyBoss = bosses.find((b) => b.tier === "weekly");
  const monthlyBoss = bosses.find((b) => b.tier === "monthly");

  const currentBoss =
    activeTier === "daily" ? dailyBoss : activeTier === "weekly" ? weeklyBoss : monthlyBoss;

  const handleQuickStrike = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch { }

    if (wallets.length === 0 || categories.length === 0) return;

    const walletId = wallets[0].id;
    const catId = categories[0].id;

    const res = await logTransaction(50, catId, walletId, "Quick Habit Strike");
    const dmgText = res.isCrit ? `CRIT! -${res.totalDamage}` : `-${res.totalDamage} DMG`;
    setFloatingDamage({ id: Date.now(), text: dmgText, isCrit: res.isCrit });
    setTimeout(() => setFloatingDamage(null), 1400);
  };

  const bossHpPercent = currentBoss
    ? Math.max(0, Math.min(100, Math.round((currentBoss.current_hp / currentBoss.max_hp) * 100)))
    : 0;

  // Empty boss state
  if (!currentBoss) {
    return (
      <ScreenContainer className="px-4 pt-2">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          <View className="py-3 mb-2">
            <Text className="text-[10px] font-black uppercase tracking-widest text-[#AF2219]">
              Combat Arena
            </Text>
            <Text className="text-2xl font-black text-stone-900">Awaiting Bosses</Text>
          </View>

          <View className={`rounded-3xl p-8 border items-center justify-center shadow-2xs ${isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-stone-200"}`}>
            <View className="h-20 w-20 rounded-2xl bg-[#AF221915] border-2 border-[#AF221930] items-center justify-center mb-4">
              <MaterialIcons name="sports-kabaddi" size={40} color="#AF2219" />
            </View>
            <Text className={`text-lg font-black text-center mb-2 ${isDark ? "text-white" : "text-stone-900"}`}>
              Boss encounters are spawning...
            </Text>
            <Text className={`text-xs font-medium text-center leading-relaxed ${isDark ? "text-stone-400" : "text-stone-500"}`}>
              Your first bosses will appear momentarily.{"\n"}Start logging expenses to deal damage!
            </Text>

            <View className="flex-row gap-2.5 mt-5">
              <Pressable
                onPress={() => router.push("/quick-log")}
                className="h-[42px] px-5 rounded-xl bg-[#AF2219] items-center justify-center active:bg-[#8F1E2C] shadow-xs flex-row gap-1.5"
              >
                <MaterialIcons name="flash-on" size={16} color="white" />
                <Text className="text-white font-bold text-xs">Quick Log Expense</Text>
              </Pressable>

              <Pressable
                onPress={() => refreshData()}
                className={`h-[42px] px-4 rounded-xl border items-center justify-center active:opacity-80 flex-row gap-1 shadow-2xs ${
                  isDark ? "bg-[#25282B] border-[#303336]" : "border-stone-200 bg-white active:bg-stone-50"
                }`}
              >
                <MaterialIcons name="refresh" size={16} color={isDark ? "#AAA7A5" : "#57534E"} />
                <Text className={`font-bold text-xs ${isDark ? "text-stone-300" : "text-stone-700"}`}>Refresh</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const canStrike = wallets.length > 0 && categories.length > 0;

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Top Header & Currencies HUD */}
        <View className="flex-row items-center justify-between py-3 mb-2">
          <View className="flex-row items-center gap-2.5">
            <View className="h-10 w-10 rounded-2xl bg-[#AF2219] items-center justify-center shadow-xs">
              <MaterialIcons name="local-fire-department" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-[10px] font-black uppercase tracking-widest text-[#AF2219]">
                Duo Habit Streak
              </Text>
              <Text className={`text-base font-black ${isDark ? "text-white" : "text-stone-900"}`}>
                {profile?.current_streak ?? 1} Days Active
              </Text>
            </View>
          </View>

          {/* Currencies Pill Bag */}
          <View className="flex-row items-center gap-2">
            <View className={`flex-row items-center gap-1 px-2.5 py-1.5 rounded-full border ${isDark ? "bg-[#2A2318] border-[#F1B64A]/40" : "bg-[#FFF1D7] border-[#F1B64A]/50"}`}>
              <MaterialIcons name="monetization-on" size={15} color="#C4880E" />
              <Text className="text-xs font-black text-[#A87610]">
                {profile?.gold ?? 0}
              </Text>
            </View>

            <View className={`flex-row items-center gap-1 px-2.5 py-1.5 rounded-full border ${isDark ? "bg-[#AF221925] border-[#AF221950]" : "bg-[#AF221915] border-[#AF221940]"}`}>
              <MaterialIcons name="stars" size={15} color="#AF2219" />
              <Text className="text-xs font-black text-[#AF2219]">
                {profile?.trk_tokens ?? 0} TRK
              </Text>
            </View>
          </View>
        </View>

        {/* Boss Tier Selector Tabs */}
        <View className={`flex-row p-1 rounded-2xl border mb-4 ${isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-stone-100 border-stone-200"}`}>
          <Pressable
            onPress={() => setActiveTier("daily")}
            className={`flex-1 py-2 rounded-xl items-center justify-center ${activeTier === "daily" ? "bg-[#AF2219] shadow-xs" : ""}`}
          >
            <Text className={`text-xs font-black ${activeTier === "daily" ? "text-white" : isDark ? "text-stone-400" : "text-stone-600"}`}>
              Daily Mob
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTier("weekly")}
            className={`flex-1 py-2 rounded-xl items-center justify-center ${activeTier === "weekly" ? "bg-[#AF2219] shadow-xs" : ""}`}
          >
            <Text className={`text-xs font-black ${activeTier === "weekly" ? "text-white" : isDark ? "text-stone-400" : "text-stone-600"}`}>
              Weekly Miniboss
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTier("monthly")}
            className={`flex-1 py-2 rounded-xl items-center justify-center ${activeTier === "monthly" ? "bg-[#AF2219] shadow-xs" : ""}`}
          >
            <Text className={`text-xs font-black ${activeTier === "monthly" ? "text-white" : isDark ? "text-stone-400" : "text-stone-600"}`}>
              Monthly Titan
            </Text>
          </Pressable>
        </View>

        {/* 16-Bit Combat Stage Arena */}
        <View className={`rounded-3xl p-5 border shadow-sm mb-4 relative overflow-hidden ${isDark ? "bg-[#1B1D1F] border-[#AF221950]" : "bg-white border-[#AF221930]"}`}>
          {/* Top Stage Badges */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="bg-[#AF221915] border border-[#AF221930] px-2.5 py-1 rounded-lg">
              <Text className="text-[10px] font-black text-[#AF2219] uppercase tracking-wider">
                {activeTier.toUpperCase()} ENCOUNTER
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="shield" size={14} color="#AF2219" />
              <Text className={`text-xs font-bold ${isDark ? "text-stone-400" : "text-stone-600"}`}>
                {profile?.streak_shields ?? 1} Shields Active
              </Text>
            </View>
          </View>

          {/* Boss Display Stage */}
          <View className={`h-44 rounded-2xl items-center justify-center border relative mb-4 ${isDark ? "bg-[#101112] border-[#303336]" : "bg-[#FAF8F6] border-stone-200"}`}>
            <View className="items-center">
              <View className="w-20 h-20 rounded-2xl bg-[#AF221915] border-2 border-[#AF2219] items-center justify-center mb-2 shadow-sm">
                <MaterialIcons
                  name={
                    activeTier === "daily"
                      ? "pest-control"
                      : activeTier === "weekly"
                        ? "security"
                        : "gavel"
                  }
                  size={42}
                  color="#AF2219"
                />
              </View>
              <Text className={`text-base font-black tracking-tight ${isDark ? "text-white" : "text-stone-900"}`}>
                {currentBoss.name}
              </Text>
              <Text className={`text-xs font-bold ${isDark ? "text-stone-400" : "text-stone-500"}`}>
                Loot: +{currentBoss.gold_reward} Gold &bull; +{currentBoss.exp_reward} EXP
                {currentBoss.trk_reward > 0 ? ` &bull; +${currentBoss.trk_reward} TRK` : ""}
              </Text>
            </View>

            {/* Floating Combat Damage */}
            {floatingDamage && (
              <View className="absolute top-6 items-center">
                <Text
                  className={`text-xl font-black ${floatingDamage.isCrit ? "text-[#AF2219] text-2xl" : "text-amber-500"}`}
                >
                  {floatingDamage.text}
                </Text>
              </View>
            )}
          </View>

          {/* Health Bar with Retro Border */}
          <View className="mb-2">
            <View className="flex-row justify-between mb-1.5 items-center">
              <Text className={`text-xs font-bold uppercase tracking-wide ${isDark ? "text-stone-300" : "text-stone-700"}`}>
                Boss Health
              </Text>
              <Text className="text-xs font-black text-[#AF2219] tabular-nums">
                {currentBoss.current_hp} / {currentBoss.max_hp} HP ({bossHpPercent}%)
              </Text>
            </View>
            <View className={`h-3.5 w-full rounded-full border overflow-hidden p-0.5 ${isDark ? "bg-stone-800 border-stone-700" : "bg-stone-100 border-stone-300"}`}>
              <View
                style={{
                  width: `${bossHpPercent}%`,
                  backgroundColor: bossHpPercent > 20 ? "#AF2219" : "#D92C3B",
                  height: "100%",
                  borderRadius: 999,
                }}
              />
            </View>
          </View>

          {/* Cleave Formula Lore Box */}
          <View className={`border rounded-xl p-2.5 mt-2 ${isDark ? "bg-[#AF221915] border-[#AF221930]" : "bg-[#AF221908] border-[#AF221920]"}`}>
            <Text className={`text-[10px] font-bold text-center ${isDark ? "text-stone-300" : "text-stone-600"}`}>
              ⚔️ Cleave Engine: Every log strikes 100% Daily Mob, 35% Weekly Miniboss & 15% Monthly Titan!
            </Text>
          </View>
        </View>

        {/* Combat Action Buttons */}
        <View className="gap-2.5 mb-5">
          {canStrike ? (
            <>
              <Continue
                title="⚡ 3-Second Quick Log & Strike"
                onPress={() => router.push("/quick-log")}
              />
              <Pressable
                onPress={handleQuickStrike}
                className={`h-[44px] rounded-xl border items-center justify-center active:opacity-80 ${
                  isDark ? "bg-[#1B1D1F] border-[#A13024]" : "bg-white border-[#A13024] active:bg-[#AF221910]"
                }`}
              >
                <Text className="text-[#AF2219] font-bold text-sm">
                  Quick Strike (Test Log ₱50)
                </Text>
              </Pressable>
            </>
          ) : (
            <View className={`border rounded-2xl p-4 items-center ${isDark ? "bg-[#1B1D1F] border-[#AF221940]" : "bg-[#AF221908] border-[#AF221920]"}`}>
              <MaterialIcons name="info-outline" size={20} color="#AF2219" />
              <Text className="text-xs font-bold text-[#AF2219] mt-2 text-center">
                Create a wallet & category in the Ledger tab to start striking bosses!
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/tracker")}
                className="mt-3 h-[40px] px-5 rounded-xl bg-[#AF2219] items-center justify-center active:bg-[#8F1E2C] flex-row items-center gap-1.5 shadow-xs"
              >
                <MaterialIcons name="account-balance-wallet" size={16} color="white" />
                <Text className="text-white font-bold text-xs">
                  Set Up Wallets & Categories
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Co-Op Duo Partnership Card */}
        <PartnerCard showUnlinkOption={false} className="mb-4" />
      </ScrollView>
    </ScreenContainer>
  );
}
