import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { formatCents, evaluateGoalUnlock, parseToCents } from "@/src/services/economyService";
import { isValidNonEmptyText, isValidPositiveAmount } from "@/src/constants";

const GOAL_ICONS = ["flight", "shield", "home", "school", "directions-car", "laptop-mac", "favorite", "star"];
const GOAL_TONES = ["#EAE5F4", "#C9E7D2", "#FFF1D7", "#DCE8F0", "#F4D5CB"];

export default function VaultScreen() {
  const { goals, profile, unlockGoal, depositToGoal, addSavingsGoal } = useTraki();
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalIcon, setNewGoalIcon] = useState(GOAL_ICONS[0]);
  const [newGoalTone, setNewGoalTone] = useState(GOAL_TONES[0]);
  const [newGoalTrkRequired, setNewGoalTrkRequired] = useState("5");

  const isGoalValid = isValidNonEmptyText(newGoalTitle) && isValidPositiveAmount(newGoalTarget) && parseToCents(newGoalTarget) > 0;

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
    } catch { }

    const ok = await unlockGoal(goalId);
    if (ok) {
      setStatusMsg({
        type: "success",
        text: `🎉 Vault Unlocked! Committed ${goal.trk_tokens_required} TRK Tokens for ${goal.title}!`,
      });
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  const handleDepositToGoal = async (goalId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { }
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    await depositToGoal(goalId, 50000);
    setStatusMsg({
      type: "success",
      text: `Saved +PHP 500.00 into ${goal.title}!`,
    });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleAddGoal = async () => {
    if (!isGoalValid) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
    const targetCents = parseToCents(newGoalTarget);
    if (targetCents <= 0) return;

    await addSavingsGoal({
      title: newGoalTitle.trim(),
      target_amount: targetCents,
      trk_tokens_required: parseInt(newGoalTrkRequired, 10) || 5,
      category: "savings",
      icon: newGoalIcon,
      tone: newGoalTone,
    });

    setNewGoalTitle("");
    setNewGoalTarget("");
    setNewGoalTrkRequired("5");
    setShowAddGoal(false);
    setStatusMsg({ type: "success", text: `Vault target "${newGoalTitle.trim()}" created!` });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="py-3 mb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] font-black uppercase tracking-widest text-[#AF2219]">
              Savings Vault
            </Text>
            <Text className="text-2xl font-black text-stone-900">Goals & Targets</Text>
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
            className={`p-3.5 rounded-2xl mb-4 border ${statusMsg.type === "success"
              ? "bg-[#C9E7D2] border-[#3C9B55]/40 text-[#1C5E2D]"
              : "bg-[#AF221915] border-[#AF221940]"
              }`}
          >
            <Text
              className={`text-xs font-bold ${statusMsg.type === "success" ? "text-[#1C5E2D]" : "text-[#AF2219]"
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
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-black uppercase tracking-wider text-stone-600">
            Active Vault Targets
          </Text>
          <Pressable onPress={() => setShowAddGoal(!showAddGoal)}>
            <Text className="text-xs font-bold text-[#AF2219]">
              {showAddGoal ? "Cancel" : "+ Add Goal"}
            </Text>
          </Pressable>
        </View>

        {/* Add Goal Form */}
        {showAddGoal && (
          <View className="bg-white rounded-2xl p-4 border border-[#AF221930] mb-4 shadow-2xs">
            <TextInput
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
              placeholder="Goal name (e.g. Tokyo Trip Fund)"
              placeholderTextColor="#8B8988"
              className="h-[44px] px-3 rounded-xl border border-stone-200 bg-[#FAF8F6] text-sm font-medium text-stone-900 mb-3"
            />
            <TextInput
              value={newGoalTarget}
              onChangeText={setNewGoalTarget}
              placeholder="Target amount (e.g. 150000)"
              placeholderTextColor="#8B8988"
              keyboardType="numeric"
              className="h-[44px] px-3 rounded-xl border border-stone-200 bg-[#FAF8F6] text-sm font-medium text-stone-900 mb-3"
            />
            <TextInput
              value={newGoalTrkRequired}
              onChangeText={setNewGoalTrkRequired}
              placeholder="TRK tokens required (e.g. 5)"
              placeholderTextColor="#8B8988"
              keyboardType="numeric"
              className="h-[44px] px-3 rounded-xl border border-stone-200 bg-[#FAF8F6] text-sm font-medium text-stone-900 mb-3"
            />
            <Text className="text-[11px] font-bold text-stone-500 mb-2">Icon</Text>
            <View className="flex-row gap-2 mb-3 flex-wrap">
              {GOAL_ICONS.map((icon) => (
                <Pressable
                  key={icon}
                  onPress={() => setNewGoalIcon(icon)}
                  className={`h-9 w-9 rounded-xl items-center justify-center border ${newGoalIcon === icon
                    ? "bg-[#AF2219] border-[#AF2219]"
                    : "bg-[#AF221915] border-[#AF221930]"
                    }`}
                >
                  <MaterialIcons name={icon as any} size={18} color={newGoalIcon === icon ? "#FFF" : "#AF2219"} />
                </Pressable>
              ))}
            </View>
            <Text className="text-[11px] font-bold text-stone-500 mb-2">Tone</Text>
            <View className="flex-row gap-2.5 mb-4">
              {GOAL_TONES.map((tone) => (
                <Pressable
                  key={tone}
                  onPress={() => setNewGoalTone(tone)}
                  style={{ backgroundColor: tone }}
                  className={`w-8 h-8 rounded-full ${newGoalTone === tone ? "border-2 border-stone-900" : "border border-stone-200"}`}
                />
              ))}
            </View>
            <Pressable
              onPress={handleAddGoal}
              disabled={!isGoalValid}
              className={`h-[44px] rounded-xl items-center justify-center ${isGoalValid
                ? "bg-[#AF2219] active:bg-[#8F1E2C]"
                : "bg-stone-200"
                }`}
            >
              <Text className={`font-bold text-sm ${isGoalValid ? "text-white" : "text-stone-400"}`}>
                Create Savings Goal
              </Text>
            </Pressable>
          </View>
        )}

        {goals.length === 0 && !showAddGoal ? (
          <View className="bg-white rounded-2xl p-6 border border-stone-200 mb-5 items-center shadow-2xs">
            <View className="h-16 w-16 rounded-2xl bg-[#AF221915] border-2 border-[#AF221930] items-center justify-center mb-3">
              <MaterialIcons name="savings" size={32} color="#AF2219" />
            </View>
            <Text className="text-base font-black text-stone-900 text-center mb-1">
              No Savings Goals Yet
            </Text>
            <Text className="text-xs text-stone-500 font-medium text-center leading-relaxed mb-4">
              Set a savings target to unlock the Vault.{"\n"}Earn TRK tokens from boss battles to unlock goals!
            </Text>
            <Pressable
              onPress={() => setShowAddGoal(true)}
              className="h-[44px] px-6 rounded-xl bg-[#AF2219] items-center justify-center active:bg-[#8F1E2C] shadow-xs"
            >
              <Text className="text-white font-bold text-sm">+ Create First Goal</Text>
            </Pressable>
          </View>
        ) : (
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
                      className={`px-2.5 py-1 rounded-full border ${g.is_unlocked
                        ? "bg-[#C9E7D2] border-[#3C9B55]/40"
                        : "bg-stone-100 border-stone-200"
                        }`}
                    >
                      <Text
                        className={`text-[10px] font-black uppercase tracking-wider ${g.is_unlocked ? "text-[#1C5E2D]" : "text-stone-600"
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
                        className={`text-[11px] font-bold ${hasEnoughTokens ? "text-[#AF2219]" : "text-stone-400"
                          }`}
                      >
                        Requires {g.trk_tokens_required} TRK
                      </Text>
                    </View>

                    {!g.is_unlocked && (
                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={() => handleDepositToGoal(g.id)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200"
                        >
                          <Text className="text-[11px] font-bold text-stone-700">+₱500</Text>
                        </Pressable>

                        <Pressable
                          onPress={() => handleUnlock(g.id)}
                          className={`px-3 py-1 rounded-lg ${canUnlock
                            ? "bg-[#AF2219] shadow-xs active:bg-[#8F1E2C]"
                            : "bg-[#AF221915] border border-[#AF221930] active:bg-[#AF221925]"
                            }`}
                        >
                          <Text
                            className={`text-[11px] font-bold ${canUnlock ? "text-white" : "text-[#AF2219]"
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
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
