import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, Alert } from "react-native";
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
    locked: false,
  },
  {
    id: "b2",
    title: "The daily double",
    detail: "Both players finish daily habit strikes for 7 consecutive days",
    rewardText: "+500 Gold & +2 TRK Tokens",
    icon: "bolt",
    tone: "#FBE8E6",
    locked: false,
  },
  {
    id: "b3",
    title: "Utility hero",
    detail: "Clear and log recurring utility bills before their due date",
    rewardText: "+100 EXP & Streak Shield",
    icon: "lightbulb",
    tone: "#FFF1D7",
    locked: true,
  },
];

export default function VaultScreen() {
  const { goals, profile, unlockGoal } = useTraki();
  const colors = useColors();
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  const handleUnlock = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !profile) return;

    const evalResult = evaluateGoalUnlock(goal, profile.trk_tokens);
    if (!evalResult.canUnlock) {
      Alert.alert("Two-Key Vault Lock", evalResult.reason ?? "Cannot unlock yet.");
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const ok = await unlockGoal(goalId);
    if (ok) {
      setCelebrationMsg(`🎉 Goal Unlocked! Committed ${goal.trk_tokens_required} TRK Tokens for ${goal.title}!`);
      setTimeout(() => setCelebrationMsg(null), 4000);
    }
  };

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="py-3 mb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-xs font-bold uppercase tracking-wider text-muted">Savings Vault</Text>
            <Text className="text-2xl font-black text-foreground">Bounties & Goals</Text>
          </View>
          <View className="flex-row items-center gap-1 bg-[#E8E4F2] dark:bg-[#322B45] px-3 py-1.5 rounded-full border border-[#9D8CD7]/30">
            <MaterialIcons name="stars" size={16} color="#7C69C4" />
            <Text className="text-xs font-extrabold text-[#5B48A2] dark:text-[#C5BBEA]">
              {profile?.trk_tokens ?? 0} TRK Tokens
            </Text>
          </View>
        </View>

        {celebrationMsg && (
          <View className="bg-success/20 border border-success p-3.5 rounded-2xl mb-4">
            <Text className="text-xs font-bold text-success text-center">{celebrationMsg}</Text>
          </View>
        )}

        {/* Two-Key Savings Goals */}
        <Text className="text-xs font-extrabold uppercase tracking-wider text-muted mb-3">
          Two-Key Vault Goals (Savings + TRK Tokens)
        </Text>

        <View className="gap-3.5 mb-6">
          {goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            const hasTokens = (profile?.trk_tokens ?? 0) >= goal.trk_tokens_required;
            const hasFunds = goal.current_amount >= goal.target_amount;
            const isUnlocked = goal.is_unlocked === 1;

            return (
              <View
                key={goal.id}
                className="bg-surface rounded-2xl p-4 border border-border"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center gap-2.5">
                    <View
                      style={{ backgroundColor: goal.tone }}
                      className="h-10 w-10 rounded-xl items-center justify-center"
                    >
                      <MaterialIcons name={(goal.icon as any) ?? "savings"} size={20} color="#171717" />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">{goal.title}</Text>
                      <Text className="text-[11px] text-muted">
                        Requires {goal.trk_tokens_required} TRK Tokens
                      </Text>
                    </View>
                  </View>

                  {isUnlocked ? (
                    <View className="bg-success/15 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                      <MaterialIcons name="check-circle" size={14} color={colors.success} />
                      <Text className="text-[11px] font-bold text-success">UNLOCKED</Text>
                    </View>
                  ) : (
                    <View className="bg-border px-2.5 py-1 rounded-full flex-row items-center gap-1">
                      <MaterialIcons name="lock" size={14} color={colors.muted} />
                      <Text className="text-[11px] font-bold text-muted">LOCKED</Text>
                    </View>
                  )}
                </View>

                {/* Progress */}
                <View className="mt-2 mb-1">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs font-semibold text-muted">Saved</Text>
                    <Text className="text-xs font-bold tabular-nums text-foreground">
                      {formatCents(goal.current_amount)} / {formatCents(goal.target_amount)} ({percent}%)
                    </Text>
                  </View>
                  <View className="h-2 w-full bg-border rounded-full overflow-hidden">
                    <View style={{ width: `${percent}%`, backgroundColor: colors.primary, height: "100%" }} />
                  </View>
                </View>

                {/* Two Keys Indicator */}
                <View className="flex-row items-center justify-between pt-3 mt-2 border-t border-border">
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons
                        name={hasFunds ? "check-circle" : "radio-button-unchecked"}
                        size={14}
                        color={hasFunds ? colors.success : colors.muted}
                      />
                      <Text className="text-[11px] font-medium text-muted">Funded</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <MaterialIcons
                        name={hasTokens ? "check-circle" : "radio-button-unchecked"}
                        size={14}
                        color={hasTokens ? colors.success : colors.muted}
                      />
                      <Text className="text-[11px] font-medium text-muted">TRK Tokens</Text>
                    </View>
                  </View>

                  {!isUnlocked && (
                    <Pressable
                      onPress={() => handleUnlock(goal.id)}
                      className={`px-3 py-1.5 rounded-xl ${
                        hasFunds && hasTokens ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <Text
                        className={`text-xs font-extrabold ${
                          hasFunds && hasTokens ? "text-white" : "text-muted"
                        }`}
                      >
                        Unlock Vault
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Weekly Bounty Boards */}
        <Text className="text-xs font-extrabold uppercase tracking-wider text-muted mb-3">
          Weekly Co-op Bounty Boards
        </Text>
        <View className="gap-3">
          {BOUNTY_CARDS.map((b) => (
            <View key={b.id} className="bg-surface rounded-2xl p-4 border border-border">
              <View className="flex-row items-start justify-between mb-1.5">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                  <View
                    style={{ backgroundColor: b.tone }}
                    className="h-9 w-9 rounded-xl items-center justify-center"
                  >
                    <MaterialIcons name={b.icon as any} size={18} color="#171717" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">{b.title}</Text>
                    <Text className="text-[11px] text-muted leading-tight mt-0.5">{b.detail}</Text>
                  </View>
                </View>
                <MaterialIcons
                  name={b.locked ? "lock" : "check"}
                  size={16}
                  color={b.locked ? colors.muted : colors.success}
                />
              </View>
              <View className="pt-2 border-t border-border mt-2 flex-row justify-between items-center">
                <Text className="text-[11px] font-medium text-muted">Reward:</Text>
                <Text className="text-[11px] font-bold text-[#A87610] dark:text-[#F6CA78]">
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
