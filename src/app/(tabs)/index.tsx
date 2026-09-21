import React, { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Continue from "@/components/continue";
import PartnerCard from "@/components/PartnerCard";
import BattlefieldArena from "@/components/BattlefieldArena";
import { CombatStrikeResult } from "@/src/types";

export default function CombatScreen() {
  const isDark = useColorScheme() === "dark";
  const { profile, bosses, logTransaction, wallets, categories, refreshData } = useTraki();
  const [activeTier, setActiveTier] = useState<"daily" | "weekly" | "monthly">("daily");
  const [isStriking, setIsStriking] = useState(false);

  const dailyBoss = bosses.find((b) => b.tier === "daily");
  const weeklyBoss = bosses.find((b) => b.tier === "weekly");
  const monthlyBoss = bosses.find((b) => b.tier === "monthly");

  const currentBoss =
    activeTier === "daily" ? dailyBoss : activeTier === "weekly" ? weeklyBoss : monthlyBoss;

  // Handle savings strike execution directly from arena
  const handleSavingsStrike = useCallback(
    async (
      amount: number,
      label: string,
      catId?: string
    ): Promise<CombatStrikeResult | void> => {
      const walletId = wallets[0]?.id ?? "w_hero_vault";
      const targetCatId = catId || categories[0]?.id || "c_coffee";

      setIsStriking(true);
      try {
        const result = await logTransaction(amount, targetCatId, walletId, label);
        return result;
      } finally {
        setIsStriking(false);
      }
    },
    [wallets, categories, logTransaction]
  );

  // Total Lifetime Savings in Pesos
  const totalSavingsInPesos = wallets.reduce(
    (acc, w) => acc + (w.balance > 0 ? w.balance / 100 : 0),
    0
  );

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
              Impulse encounters are spawning...
            </Text>
            <Text className={`text-xs font-medium text-center leading-relaxed ${isDark ? "text-stone-400" : "text-stone-500"}`}>
              Resist impulse purchases and log your saved money to strike monsters!
            </Text>

            <View className="flex-row gap-2.5 mt-5">
              <Pressable
                onPress={() => router.push("/quick-log")}
                className="h-[42px] px-5 rounded-xl bg-[#AF2219] items-center justify-center active:bg-[#8F1E2C] shadow-xs flex-row gap-1.5"
              >
                <MaterialIcons name="flash-on" size={16} color="white" />
                <Text className="text-white font-bold text-xs">Log Saved Amount</Text>
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

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ─── TOP STATUS HUD & CURRENCIES ─── */}
        <View className="flex-row items-center justify-between py-3 mb-2">
          <View className="flex-row items-center gap-2.5">
            <View className="h-10 w-10 rounded-2xl bg-[#AF2219] items-center justify-center shadow-xs">
              <MaterialIcons name="local-fire-department" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-[10px] font-black uppercase tracking-widest text-[#AF2219]">
                Self-Control Streak
              </Text>
              <Text className={`text-base font-black ${isDark ? "text-white" : "text-stone-900"}`}>
                {profile?.current_streak ?? 1} Days Active
              </Text>
            </View>
          </View>

          {/* Currencies Badge */}
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

        {/* ─── ANIMATED BATTLEFIELD ARENA ─── */}
        <BattlefieldArena
          boss={currentBoss}
          profile={profile}
          activeTier={activeTier}
          onSelectTier={setActiveTier}
          onExecuteSavingsStrike={handleSavingsStrike}
          isStriking={isStriking}
        />

        {/* ─── SAVINGS HERO OVERVIEW CARD ─── */}
        <View
          className={`rounded-2xl p-4 border mb-4 shadow-2xs ${
            isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-stone-200"
          }`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
                <MaterialIcons name="savings" size={22} color="#10B981" />
              </View>
              <View>
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-stone-400" : "text-stone-500"}`}>
                  Total Resisted & Saved
                </Text>
                <Text className={`text-lg font-black ${isDark ? "text-white" : "text-stone-900"}`}>
                  ₱{totalSavingsInPesos.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View className="bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Text className="text-[10px] font-black text-emerald-500">
                VAULT SECURED
              </Text>
            </View>
          </View>
        </View>

        {/* ─── PRIMARY COMBAT ACTIONS ─── */}
        <View className="gap-2.5 mb-5">
          <Continue
            title="⚡ Custom Resisted Expense Log"
            onPress={() => router.push("/quick-log")}
          />
        </View>

        {/* Co-Op Duo Partnership Card */}
        <PartnerCard showUnlinkOption={false} className="mb-4" />
      </ScrollView>
    </ScreenContainer>
  );
}
