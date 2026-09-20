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
import Continue from "@/components/continue";
import PartnerCard from "@/components/PartnerCard";

export default function CombatScreen() {
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

          <View className="bg-white rounded-3xl p-8 border border-stone-200 items-center justify-center shadow-2xs">
            <View className="h-20 w-20 rounded-2xl bg-[#AF221915] border-2 border-[#AF221930] items-center justify-center mb-4">
              <MaterialIcons name="sports-kabaddi" size={40} color="#AF2219" />
            </View>
            <Text className="text-lg font-black text-stone-900 text-center mb-2">
              Boss encounters are spawning...
            </Text>
            <Text className="text-xs text-stone-500 font-medium text-center leading-relaxed">
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
                className="h-[42px] px-4 rounded-xl border border-stone-200 bg-white items-center justify-center active:bg-stone-50 flex-row gap-1 shadow-2xs"
              >
                <MaterialIcons name="refresh" size={16} color="#57534E" />
                <Text className="text-stone-700 font-bold text-xs">Refresh</Text>
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
              <Text className="text-base font-black text-stone-900">
                {profile?.current_streak ?? 1} Days Active
              </Text>
            </View>
          </View>

          {/* Currencies Pill Bag */}
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1 bg-[#FFF1D7] px-2.5 py-1.5 rounded-full border border-[#F1B64A]/50">
              <MaterialIcons name="monetization-on" size={15} color="#C4880E" />
              <Text className="text-xs font-black text-[#A87610]">
                {profile?.gold ?? 0}
              </Text>
            </View>

            <View className="flex-row items-center gap-1 bg-[#AF221915] px-2.5 py-1.5 rounded-full border border-[#AF221940]">
              <MaterialIcons name="stars" size={15} color="#AF2219" />
              <Text className="text-xs font-black text-[#AF2219]">
                {profile?.trk_tokens ?? 0} TRK
              </Text>
            </View>
          </View>
        </View>

        {/* Boss Tier Selector Tabs */}
        <View className="flex-row p-1 bg-stone-100 rounded-2xl border border-stone-200 mb-4">
          <Pressable
            onPress={() => setActiveTier("daily")}
            className={`flex-1 py-2 rounded-xl items-center justify-center ${activeTier === "daily" ? "bg-[#AF2219] shadow-xs" : ""}`}
          >
            <Text className={`text-xs font-black ${activeTier === "daily" ? "text-white" : "text-stone-600"}`}>
              Daily Mob
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTier("weekly")}
            className={`flex-1 py-2 rounded-xl items-center justify-center ${activeTier === "weekly" ? "bg-[#AF2219] shadow-xs" : ""}`}
          >
            <Text className={`text-xs font-black ${activeTier === "weekly" ? "text-white" : "text-stone-600"}`}>
              Weekly Miniboss
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTier("monthly")}
            className={`flex-1 py-2 rounded-xl items-center justify-center ${activeTier === "monthly" ? "bg-[#AF2219] shadow-xs" : ""}`}
          >
            <Text className={`text-xs font-black ${activeTier === "monthly" ? "text-white" : "text-stone-600"}`}>
              Monthly Titan
            </Text>
          </Pressable>
        </View>

        {/* 16-Bit Combat Stage Arena */}
        <View className="bg-white rounded-3xl p-5 border border-[#AF221930] shadow-sm mb-4 relative overflow-hidden">
          {/* Top Stage Badges */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="bg-[#AF221915] border border-[#AF221930] px-2.5 py-1 rounded-lg">
              <Text className="text-[10px] font-black text-[#AF2219] uppercase tracking-wider">
                {activeTier.toUpperCase()} ENCOUNTER
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <MaterialIcons name="shield" size={14} color="#AF2219" />
              <Text className="text-xs font-bold text-stone-600">
                {profile?.streak_shields ?? 1} Shields Active
              </Text>
            </View>
          </View>

          {/* Boss Display Stage */}
          <View className="h-44 bg-[#FAF8F6] rounded-2xl items-center justify-center border border-stone-200 relative mb-4">
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
              <Text className="text-base font-black text-stone-900 tracking-tight">
                {currentBoss.name}
              </Text>
              <Text className="text-xs font-bold text-stone-500">
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
              <Text className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                Boss Health
              </Text>
              <Text className="text-xs font-black text-[#AF2219] tabular-nums">
                {currentBoss.current_hp} / {currentBoss.max_hp} HP ({bossHpPercent}%)
              </Text>
            </View>
            <View className="h-3.5 w-full bg-stone-100 rounded-full border border-stone-300 overflow-hidden p-0.5">
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
          <View className="bg-[#AF221908] border border-[#AF221920] rounded-xl p-2.5 mt-2">
            <Text className="text-[10px] font-bold text-stone-600 text-center">
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
                className="h-[44px] rounded-xl bg-white border border-[#A13024] items-center justify-center active:bg-[#AF221910]"
              >
                <Text className="text-[#AF2219] font-bold text-sm">
                  Quick Strike (Test Log ₱50)
                </Text>
              </Pressable>
            </>
          ) : (
            <View className="bg-[#AF221908] border border-[#AF221920] rounded-2xl p-4 items-center">
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
