import React, { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { formatCents, evaluateGoalUnlock } from "@/src/services/economyService";

const BOUNTY_CARDS = [
  {
    id: "b1",
    title: "No-Spend Weekend",
    detail: "Complete 2 shared days without non-essential impulse purchases",
    rewardText: "+250 Gold & +1 TRK Token",
    icon: "savings",
    status: "Active",
  },
  {
    id: "b2",
    title: "The Daily Double",
    detail: "Both partners finish daily habit strikes for 7 consecutive days",
    rewardText: "+500 Gold & +2 TRK Tokens",
    icon: "bolt",
    status: "In Progress (5/7)",
  },
  {
    id: "b3",
    title: "Utility Champion",
    detail: "Clear and log recurring utility bills before their due date",
    rewardText: "+100 EXP & Streak Shield",
    icon: "lightbulb",
    status: "Locked",
  },
];

export default function VaultScreen() {
  const { goals, profile, unlockGoal } = useTraki();
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUnlock = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !profile) return;

    const evalResult = evaluateGoalUnlock(goal, profile.trk_tokens);
    if (!evalResult.canUnlock) {
      setStatusMsg({
        type: "error",
        text: evalResult.reason ?? "Goal lock requirements not yet met.",
      });
      setTimeout(() => setStatusMsg(null), 4500);
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const ok = await unlockGoal(goalId);
    if (ok) {
      setStatusMsg({
        type: "success",
        text: `🎉 Vault Unlocked! Committed ${goal.trk_tokens_required} TRK Tokens for ${goal.title}!`,
      });
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  const handleDepositToGoal = async (goal: (typeof goals)[0]) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    goal.current_amount += 50000;
    setStatusMsg({
      type: "success",
      text: `Saved +PHP 500.00 into ${goal.title}!`,
    });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="py-3 mb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] font-black uppercase tracking-widest text-[#AF2219]">
              Savings Vault
            </Text>
            <Text className="text-2xl font-black text-stone-900">Bounties & Goals</Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-[#AF221915] px-3 py-1.5 rounded-full border border-[#AF221940]">
            <MaterialIcons name="stars" size={16} color="#AF2219" />
            <Text className="text-xs font-black text-[#AF2219]">
              {profile?.trk_tokens ?? 0} TRK Tokens
            </Text>
          </View>
        </View>

        {/* Feedback Alert Toast */}
        {statusMsg && (
          <View
            className={`p-3.5 rounded-2xl mb-4 border ${
              statusMsg.type === "success"
                ? "bg-[#C9E7D2] border-[#3C9B55]/40 text-[#1C5E2D]"
                : "bg-[#AF221915] border-[#AF221940]"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                statusMsg.type === "success" ? "text-[#1C5E2D]" : "text-[#AF2219]"
              }`}
            >
              {statusMsg.text}
            </Text>
          </View>
        )}

        {/* Two-Key Mechanic Explanation Card */}
        <View className="bg-white rounded-2xl p-4 border border-[#AF221930] mb-5 shadow-2xs">
          <View className="flex-row items-center gap-2 mb-2">
            <View className="h-7 w-7 rounded-lg bg-[#AF2219] items-center justify-center">
              <MaterialIcons name="vpn-key" size={16} color="#FFFFFF" />
            </View>
            <Text className="text-xs font-black text-stone-900 uppercase tracking-wide">
              Two-Key Vault Mechanism
            </Text>
          </View>
          <Text className="text-xs text-stone-600 leading-relaxed font-medium">
            To prevent impulsive spending on unlocked goals, each real-world target requires:
          </Text>
          <View className="mt-2.5 gap-1.5">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="check-circle" size={14} color="#3C9B55" />
              <Text className="text-xs text-stone-700 font-semibold">
                1. 100% Real-World Funded Balance
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="stars" size={14} color="#AF2219" />
              <Text className="text-xs text-stone-700 font-semibold">
                2. Conquered Boss TRK Tokens (from Weekly/Monthly victories)
              </Text>
            </View>
          </View>
        </View>

        {/* Savings Goals List */}
        <Text className="text-xs font-black uppercase tracking-wider text-stone-600 mb-2.5">
          Active Vault Targets
        </Text>

        <View className="gap-3.5 mb-5">
          {goals.map((g) => {
            const fundedPercent = Math.min(
              100,
              Math.round((g.current_amount / g.target_amount) * 100)
            );
            const hasEnoughTokens = (profile?.trk_tokens ?? 0) >= g.trk_tokens_required;
            const isFullyFunded = g.current_amount >= g.target_amount;
            const canUnlock = isFullyFunded && hasEnoughTokens && !g.is_unlocked;

            return (
              <View
                key={g.id}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-10 w-10 rounded-xl bg-[#AF221915] border border-[#AF221930] items-center justify-center">
                      <MaterialIcons name={g.icon as any} size={20} color="#AF2219" />
                    </View>
                    <View>
                      <Text className="text-sm font-black text-stone-900">{g.title}</Text>
                      <Text className="text-[11px] text-stone-500 font-medium">
                        Target: {formatCents(g.target_amount)}
                      </Text>
                    </View>
                  </View>

                  <View
                    className={`px-2.5 py-1 rounded-full border ${
                      g.is_unlocked
                        ? "bg-[#C9E7D2] border-[#3C9B55]/40"
                        : "bg-stone-100 border-stone-200"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        g.is_unlocked ? "text-[#1C5E2D]" : "text-stone-600"
                      }`}
                    >
                      {g.is_unlocked ? "Unlocked" : "Locked"}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="mt-2 mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-[11px] font-bold text-stone-500">Funded Amount</Text>
                    <Text className="text-[11px] font-black text-stone-900 tabular-nums">
                      {formatCents(g.current_amount)} ({fundedPercent}%)
                    </Text>
                  </View>
                  <View className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                    <View
                      style={{
                        width: `${fundedPercent}%`,
                        backgroundColor: fundedPercent >= 100 ? "#3C9B55" : "#AF2219",
                        height: "100%",
                        borderRadius: 999,
                      }}
                    />
                  </View>
                </View>

                {/* Requirements Badges */}
                <View className="flex-row items-center justify-between pt-2 border-t border-stone-100">
                  <View className="flex-row items-center gap-1.5">
                    <MaterialIcons
                      name="stars"
                      size={14}
                      color={hasEnoughTokens ? "#AF2219" : "#8B8988"}
                    />
                    <Text
                      className={`text-[11px] font-bold ${
                        hasEnoughTokens ? "text-[#AF2219]" : "text-stone-400"
                      }`}
                    >
                      Requires {g.trk_tokens_required} TRK
                    </Text>
                  </View>

                  {!g.is_unlocked && (
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleDepositToGoal(g)}
                        className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200"
                      >
                        <Text className="text-[11px] font-bold text-stone-700">+₱500</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleUnlock(g.id)}
                        disabled={!canUnlock}
                        className={`px-3 py-1 rounded-lg ${
                          canUnlock
                            ? "bg-[#AF2219] shadow-xs active:bg-[#8F1E2C]"
                            : "bg-stone-200 opacity-60"
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-bold ${
                            canUnlock ? "text-white" : "text-stone-400"
                          }`}
                        >
                          Unlock
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Bounties & Shared Quests */}
        <Text className="text-xs font-black uppercase tracking-wider text-stone-600 mb-2.5">
          Duo Bounties & Quests
        </Text>

        <View className="gap-2.5">
          {BOUNTY_CARDS.map((b) => (
            <View
              key={b.id}
              className="bg-white rounded-2xl p-3.5 border border-stone-200 flex-row items-center justify-between shadow-2xs"
            >
              <View className="flex-row items-center gap-3 flex-1 pr-2">
                <View className="h-9 w-9 rounded-xl bg-[#AF221915] border border-[#AF221930] items-center justify-center">
                  <MaterialIcons name={b.icon as any} size={18} color="#AF2219" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-black text-stone-900">{b.title}</Text>
                  <Text className="text-[10px] text-stone-500 mt-0.5">{b.detail}</Text>
                  <Text className="text-[10px] font-bold text-[#AF2219] mt-1">{b.rewardText}</Text>
                </View>
              </View>
              <View className="px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200">
                <Text className="text-[10px] font-bold text-stone-600">{b.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
