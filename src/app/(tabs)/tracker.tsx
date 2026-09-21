import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { formatCents } from "@/src/services/economyService";
import { isValidNonEmptyText, ECONOMY_CONFIG } from "@/src/constants";
import { useColorScheme } from "@/hooks/use-color-scheme";

const WALLET_COLORS = ["#AF2219", "#3C9B55", "#2B6CB0", "#D92C3B", "#F1B64A", "#8B5CF6"];
const WALLET_TYPES: { label: string; value: "cash" | "bank" | "credit" | "savings" }[] = [
  { label: "Vault", value: "savings" },
  { label: "Cash", value: "cash" },
  { label: "Bank", value: "bank" },
  { label: "Credit", value: "credit" },
];

export default function TrackerScreen() {
  const isDark = useColorScheme() === "dark";
  const { wallets, transactions, categories, addWallet, addCategory } = useTraki();
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletType, setNewWalletType] = useState<"cash" | "bank" | "credit" | "savings">("savings");
  const [newWalletColor, setNewWalletColor] = useState(WALLET_COLORS[0]);

  const totalSavedCents = wallets.reduce((sum, w) => sum + Math.max(0, w.balance), 0);

  const filteredTransactions = selectedWalletId
    ? transactions.filter((t) => t.wallet_id === selectedWalletId)
    : transactions;

  const isWalletValid = isValidNonEmptyText(newWalletName);

  const handleAddWallet = async () => {
    if (!isWalletValid) return;
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
    await addWallet({
      name: newWalletName.trim(),
      type: newWalletType,
      balance: 0,
      currency: "PHP",
      color: newWalletColor,
    });
    setNewWalletName("");
    setShowAddWallet(false);
  };

  const handleQuickAddCategories = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
    for (const cat of ECONOMY_CONFIG.DEFAULT_CATEGORIES) {
      await addCategory({ name: cat.name, icon: cat.icon, budget_cap: 500000, color: cat.color });
    }
  };

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header with Total Savings Vault */}
        <View className="flex-row items-center justify-between py-3 mb-2">
          <View>
            <Text className="text-[10px] font-black uppercase tracking-widest text-[#AF2219]">
              Total Savings Vault
            </Text>
            <Text className={`text-2xl font-black tabular-nums tracking-tight ${isDark ? "text-white" : "text-stone-900"}`}>
              {wallets.length > 0 ? formatCents(totalSavedCents) : "PHP 0.00"}
            </Text>
          </View>
          {wallets.length > 0 && categories.length > 0 && (
            <Pressable
              onPress={() => router.push("/quick-log")}
              className="h-10 w-10 rounded-2xl bg-[#AF2219] items-center justify-center shadow-xs active:bg-[#8F1E2C]"
            >
              <MaterialIcons name="add" size={24} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        {/* Savings Vaults Section */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-stone-400" : "text-stone-600"}`}>
            Savings Vaults & Buckets
          </Text>
          <View className="flex-row items-center gap-2">
            {selectedWalletId && (
              <Pressable onPress={() => setSelectedWalletId(null)}>
                <Text className="text-xs font-bold text-[#AF2219]">Clear filter</Text>
              </Pressable>
            )}
            {wallets.length > 0 && (
              <Pressable onPress={() => setShowAddWallet(!showAddWallet)}>
                <Text className="text-xs font-bold text-[#AF2219]">
                  {showAddWallet ? "Cancel" : "+ Add Vault"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Empty Wallet State */}
        {wallets.length === 0 && !showAddWallet ? (
          <View className={`rounded-2xl p-6 border mb-5 items-center shadow-2xs ${isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-stone-200"}`}>
            <View className="h-16 w-16 rounded-2xl bg-[#AF221915] border-2 border-[#AF221930] items-center justify-center mb-3">
              <MaterialIcons name="savings" size={32} color="#AF2219" />
            </View>
            <Text className={`text-base font-black text-center mb-1 ${isDark ? "text-white" : "text-stone-900"}`}>
              Create Your First Savings Vault
            </Text>
            <Text className={`text-xs font-medium text-center leading-relaxed mb-4 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
              Store your resisted impulse money and watch{"\n"}your savings accumulate with every battle!
            </Text>
            <Pressable
              onPress={() => setShowAddWallet(true)}
              className="h-[44px] px-6 rounded-xl bg-[#AF2219] items-center justify-center active:bg-[#8F1E2C] shadow-xs"
            >
              <Text className="text-white font-bold text-sm">+ Create Vault</Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-2.5 mb-5">
            {wallets.map((w) => {
              const isSelected = selectedWalletId === w.id;
              return (
                <Pressable
                  key={w.id}
                  onPress={() => setSelectedWalletId(isSelected ? null : w.id)}
                  className={`p-3.5 rounded-2xl flex-1 min-w-[140px] border ${isSelected
                    ? isDark ? "bg-[#25282B] border-[#AF2219] shadow-xs" : "bg-white border-[#AF2219] shadow-xs"
                    : isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-stone-200"
                    }`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className={`text-xs font-bold ${isDark ? "text-stone-400" : "text-stone-600"}`}>{w.name}</Text>
                    <View
                      style={{ backgroundColor: w.color }}
                      className="w-2.5 h-2.5 rounded-full"
                    />
                  </View>
                  <Text
                    className={`text-base font-black tabular-nums text-emerald-600 ${isDark ? "text-emerald-400" : ""}`}
                  >
                    +{formatCents(Math.max(0, w.balance))}
                  </Text>
                  {isSelected && (
                    <Text className="text-[10px] font-bold text-[#AF2219] mt-1">
                      Filtered
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Add Wallet Form */}
        {showAddWallet && (
          <View className={`rounded-2xl p-4 border mb-5 shadow-2xs ${isDark ? "bg-[#1B1D1F] border-[#AF221950]" : "bg-white border-[#AF221930]"}`}>
            <Text className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? "text-stone-300" : "text-stone-600"}`}>
              New Savings Vault
            </Text>
            <TextInput
              value={newWalletName}
              onChangeText={setNewWalletName}
              placeholder="Vault name (e.g. Dream Trip Vault)"
              placeholderTextColor={isDark ? "#707579" : "#8B8988"}
              className={`h-[44px] px-3 rounded-xl border text-sm font-medium mb-3 ${isDark ? "border-[#303336] bg-[#101112] text-white" : "border-stone-200 bg-[#FAF8F6] text-stone-900"}`}
            />
            <Text className={`text-[11px] font-bold mb-2 ${isDark ? "text-stone-400" : "text-stone-500"}`}>Type</Text>
            <View className="flex-row gap-2 mb-3">
              {WALLET_TYPES.map((wt) => (
                <Pressable
                  key={wt.value}
                  onPress={() => setNewWalletType(wt.value)}
                  className={`px-3 py-1.5 rounded-lg border ${newWalletType === wt.value
                    ? "bg-[#AF2219] border-[#AF2219]"
                    : isDark ? "bg-[#25282B] border-[#303336]" : "bg-white border-stone-200"
                    }`}
                >
                  <Text className={`text-xs font-bold ${newWalletType === wt.value ? "text-white" : (isDark ? "text-stone-300" : "text-stone-600")}`}>
                    {wt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text className={`text-[11px] font-bold mb-2 ${isDark ? "text-stone-400" : "text-stone-500"}`}>Color</Text>
            <View className="flex-row gap-2.5 mb-4">
              {WALLET_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewWalletColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full ${newWalletColor === c ? (isDark ? "border-2 border-white" : "border-2 border-stone-900") : "border border-stone-300"}`}
                />
              ))}
            </View>
            <Pressable
              onPress={handleAddWallet}
              disabled={!isWalletValid}
              className={`h-[44px] rounded-xl items-center justify-center ${isWalletValid
                ? "bg-[#AF2219] active:bg-[#8F1E2C]"
                : isDark ? "bg-stone-800" : "bg-stone-200"
                }`}
            >
              <Text className={`font-bold text-sm ${isWalletValid ? "text-white" : (isDark ? "text-stone-500" : "text-stone-400")}`}>
                Create Savings Vault
              </Text>
            </Pressable>
          </View>
        )}

        {/* Temptations Resisted by Category */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-stone-400" : "text-stone-600"}`}>
            Temptation Defense Categories
          </Text>
        </View>

        {categories.length === 0 ? (
          <View className={`rounded-2xl p-6 border mb-5 items-center shadow-2xs ${isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-stone-200"}`}>
            <View className="h-14 w-14 rounded-2xl bg-[#AF221915] border border-[#AF221930] items-center justify-center mb-3">
              <MaterialIcons name="shield" size={28} color="#AF2219" />
            </View>
            <Text className={`text-sm font-black text-center mb-1 ${isDark ? "text-white" : "text-stone-900"}`}>
              Set Up Self-Control Categories
            </Text>
            <Text className={`text-xs font-medium text-center leading-relaxed mb-4 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
              Categories categorize the impulse temptations you conquer.
            </Text>
            <Pressable
              onPress={handleQuickAddCategories}
              className="h-[44px] px-6 rounded-xl bg-[#AF2219] items-center justify-center active:bg-[#8F1E2C] shadow-xs"
            >
              <Text className="text-white font-bold text-sm">+ Quick Setup (Default Categories)</Text>
            </Pressable>
          </View>
        ) : (
          <View className={`rounded-2xl p-4 border mb-5 shadow-2xs ${isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-stone-200"}`}>
            {categories.map((c) => {
              const savedCents = transactions
                .filter((t) => t.category_id === c.id)
                .reduce((sum, t) => sum + t.amount, 0);

              return (
                <View key={c.id} className="mb-3 last:mb-0">
                  <View className="flex-row justify-between items-center mb-1">
                    <View className="flex-row items-center gap-2">
                      <MaterialIcons name={c.icon as any} size={16} color="#AF2219" />
                      <Text className={`text-xs font-bold ${isDark ? "text-stone-200" : "text-stone-800"}`}>{c.name}</Text>
                    </View>
                    <Text className="text-xs font-black tabular-nums text-emerald-600">
                      +{formatCents(savedCents)} Saved
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Savings Victory History */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className={`text-xs font-black uppercase tracking-wider ${isDark ? "text-stone-400" : "text-stone-600"}`}>
            Recent Self-Control Victories
          </Text>
          <Text className="text-xs font-bold text-stone-400">
            {filteredTransactions.length} strikes
          </Text>
        </View>

        <View className={`rounded-2xl border overflow-hidden shadow-2xs ${isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-stone-200"}`}>
          {filteredTransactions.length === 0 ? (
            <View className="p-8 items-center justify-center gap-2">
              <Text className="text-xs font-bold text-stone-400 text-center">
                No savings logged yet. Strike the impulse mobs to build your vault!
              </Text>
              <Pressable
                onPress={() => router.push("/quick-log")}
                className="mt-2 px-4 py-2 rounded-xl bg-[#AF221915] border border-[#AF221940] active:bg-[#AF221925] flex-row items-center gap-1.5"
              >
                <MaterialIcons name="flash-on" size={14} color="#AF2219" />
                <Text className="text-xs font-bold text-[#AF2219]">Log First Resisted Buy</Text>
              </Pressable>
            </View>
          ) : (
            filteredTransactions.map((tx, idx) => {
              const cat = categories.find((c) => c.id === tx.category_id);
              const isLast = idx === filteredTransactions.length - 1;
              const dateStr = new Date(tx.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <View
                  key={tx.id}
                  className={`p-3.5 flex-row items-center justify-between ${!isLast ? (isDark ? "border-b border-[#303336]" : "border-b border-stone-100") : ""
                    }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
                      <MaterialIcons
                        name={(cat?.icon ?? "shield") as any}
                        size={18}
                        color="#10B981"
                      />
                    </View>
                    <View>
                      <Text className={`text-xs font-bold ${isDark ? "text-stone-200" : "text-stone-800"}`}>{tx.note || cat?.name || "Resisted Buy"}</Text>
                      <Text className="text-[10px] text-stone-400 font-medium">{dateStr}</Text>
                    </View>
                  </View>
                  <Text className="text-sm font-black text-emerald-600 tabular-nums">
                    +{formatCents(tx.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
