import React, { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { useColors } from "@/hooks/use-colors";
import { formatCents, evaluateGoalUnlock } from "@/src/services/economyService";

const BOUNTY_CARDS = [
  {
    id: "b1",
    title: "No-spend weekend",
    detail: "Complete 2 shared days without non-essential purchases",
    rewardText: "+250 Gold & +1 TRK Token",
    icon: "savings",
    tone: "#EAE5F4",
    status: "Active",
  },
  {
    id: "b2",
    title: "The daily double",
    detail: "Both players finish daily habit strikes for 7 consecutive days",
    rewardText: "+500 Gold & +2 TRK Tokens",
    icon: "bolt",
    tone: "#FBE8E6",
    status: "In Progress (5/7)",
  },
  {
    id: "b3",
    title: "Utility hero",
    detail: "Clear and log recurring utility bills before their due date",
    rewardText: "+100 EXP & Streak Shield",
    icon: "lightbulb",
    tone: "#FFF1D7",
    status: "Locked",
  },
];

export default function VaultScreen() {
  const { goals, profile, unlockGoal, logTransaction, wallets } = useTraki();
  const colors = useColors();
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
    // Simulate deposit of 500 PHP
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
            <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
              Savings Vault
            </Text>
            <Text className="text-2xl font-black text-foreground">Bounties & Goals</Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-[#E8E4F2] dark:bg-[#322B45] px-3 py-1.5 rounded-full border border-[#9D8CD7]/40">
            <MaterialIcons name="stars" size={16} color="#7C69C4" />
            <Text className="text-xs font-black text-[#5B48A2] dark:text-[#C5BBEA]">
              {profile?.trk_tokens ?? 0} TRK Tokens
            </Text>
          </View>
        </View>

        {/* Status Toast Banner */}
        {statusMsg && (
          <View
            className={`p-3.5 rounded-2xl mb-4 border ${
              statusMsg.type === "success"
                ? "bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800"
            }`}
          >
            <Text
              className={`text-xs font-bold text-center ${
                statusMsg.type === "success" ? "text-green-800 dark:text-green-300" : "text-primary"
              }`}
            >
              {statusMsg.text}
            </Text>
          </View>
        )}

        {/* Two-Key Savings Goals */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-extrabold uppercase tracking-wider text-muted">
            Two-Key Vault Goals
          </Text>
          <Text className="text-[11px] font-semibold text-primary">Funds + TRK</Text>
        </View>

        <View className="gap-3.5 mb-6">
          {goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            const hasTokens = (profile?.trk_tokens ?? 0) >= goal.trk_tokens_required;
            const hasFunds = goal.current_amount >= goal.target_amount;
            const isUnlocked = goal.is_unlocked === 1;

            return (
              <View
                key={goal.id}
                className="bg-surface rounded-2xl p-4 border border-border shadow-2xs"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center gap-3 flex-1 pr-2">
                    <View
                      style={{ backgroundColor: goal.tone }}
                      className="h-11 w-11 rounded-2xl items-center justify-center shadow-2xs"
                    >
                      <MaterialIcons name={(goal.icon as any) ?? "savings"} size={22} color="#171717" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-black text-foreground">{goal.title}</Text>
                      <Text className="text-[11px] text-muted font-medium">
                        Requires {goal.trk_tokens_required} TRK Tokens
                      </Text>
                    </View>
                  </View>

                  {isUnlocked ? (
                    <View className="bg-green-100 dark:bg-green-950/60 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                      <MaterialIcons name="check-circle" size={13} color={colors.success} />
                      <Text className="text-[10px] font-black text-success">UNLOCKED</Text>
                    </View>
                  ) : (
                    <View className="bg-canvas border border-border px-2.5 py-1 rounded-full flex-row items-center gap-1">
                      <MaterialIcons name="lock" size={13} color={colors.muted} />
                      <Text className="text-[10px] font-bold text-muted">DUAL LOCKED</Text>
                    </View>
                  )}
                </View>

                {/* Progress Bar */}
                <View className="mt-2 mb-1">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs font-semibold text-muted">Savings Progress</Text>
                    <Text className="text-xs font-black tabular-nums text-foreground">
                      {formatCents(goal.current_amount)} / {formatCents(goal.target_amount)} ({percent}%)
                    </Text>
                  </View>
                  <View className="h-2 w-full bg-border rounded-full overflow-hidden">
                    <View
                      style={{
                        width: `${percent}%`,
                        backgroundColor: percent >= 100 ? colors.success : colors.primary,
                        height: "100%",
                      }}
                    />
                  </View>
                </View>

                {/* Two Keys Indicator & Actions */}
                <View className="flex-row items-center justify-between pt-3 mt-2 border-t border-border">
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons
                        name={hasFunds ? "check-circle" : "radio-button-unchecked"}
                        size={15}
                        color={hasFunds ? colors.success : colors.muted}
                      />
                      <Text className="text-[11px] font-semibold text-muted">Funds Met</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons
                        name={hasTokens ? "check-circle" : "radio-button-unchecked"}
                        size={15}
                        color={hasTokens ? colors.success : colors.muted}
                      />
                      <Text className="text-[11px] font-semibold text-muted">TRK Ready</Text>
                    </View>
                  </View>

                  {!isUnlocked ? (
                    <View className="flex-row items-center gap-2">
                      <Pressable
                        onPress={() => handleDepositToGoal(goal)}
                        className="px-2.5 py-1.5 rounded-xl bg-canvas border border-border"
                      >
                        <Text className="text-[11px] font-bold text-foreground">+PHP 500</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleUnlock(goal.id)}
                        className={`px-3 py-1.5 rounded-xl ${
                          hasFunds && hasTokens ? "bg-primary" : "bg-border"
                        }`}
                      >
                        <Text
                          className={`text-xs font-black ${
                            hasFunds && hasTokens ? "text-white" : "text-muted"
                          }`}
                        >
                          Unlock Vault
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        {/* Weekly Bounty Boards */}
        <Text className="text-xs font-extrabold uppercase tracking-wider text-muted mb-2.5">
          Weekly Co-op Bounty Boards
        </Text>
        <View className="gap-3">
          {BOUNTY_CARDS.map((b) => (
            <View key={b.id} className="bg-surface rounded-2xl p-4 border border-border shadow-2xs">
              <View className="flex-row items-start justify-between mb-1.5">
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View
                    style={{ backgroundColor: b.tone }}
                    className="h-10 w-10 rounded-2xl items-center justify-center"
                  >
                    <MaterialIcons name={b.icon as any} size={20} color="#171717" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-black text-foreground">{b.title}</Text>
                    <Text className="text-[11px] text-muted leading-tight mt-0.5">{b.detail}</Text>
                  </View>
                </View>
                <View className="bg-canvas px-2 py-0.5 rounded-md border border-border">
                  <Text className="text-[10px] font-bold text-muted">{b.status}</Text>
                </View>
              </View>
              <View className="pt-2.5 border-t border-border mt-2 flex-row justify-between items-center">
                <Text className="text-[11px] font-medium text-muted">Bounty Reward:</Text>
                <Text className="text-[11px] font-black text-[#A87610] dark:text-[#F6CA78]">
                  {b.rewardText}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
