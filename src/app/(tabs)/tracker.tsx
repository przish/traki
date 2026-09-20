import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { formatCents } from "@/src/services/economyService";
import { isValidNonEmptyText } from "@/src/constants";

const WALLET_COLORS = ["#3C9B55", "#2B6CB0", "#D92C3B", "#F1B64A", "#AF2219", "#8B5CF6"];
const WALLET_TYPES: { label: string; value: "cash" | "bank" | "credit" | "savings" }[] = [
  { label: "Cash", value: "cash" },
  { label: "Bank", value: "bank" },
  { label: "Credit", value: "credit" },
  { label: "Savings", value: "savings" },
];

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "restaurant", color: "#F4D5CB" },
  { name: "Transport", icon: "directions-car", color: "#DCE8F0" },
  { name: "Bills & Utilities", icon: "lightbulb", color: "#FFF1D7" },
  { name: "Shopping", icon: "shopping-bag", color: "#EAE5F4" },
];

export default function TrackerScreen() {
  const { wallets, transactions, categories, addWallet, addCategory } = useTraki();
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletType, setNewWalletType] = useState<"cash" | "bank" | "credit" | "savings">("cash");
  const [newWalletColor, setNewWalletColor] = useState(WALLET_COLORS[0]);

  const netWorthCents = wallets.reduce((sum, w) => sum + w.balance, 0);

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
    for (const cat of DEFAULT_CATEGORIES) {
      await addCategory({ name: cat.name, icon: cat.icon, budget_cap: 500000, color: cat.color });
    }
  };

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header with Net Worth */}
        <View className="flex-row items-center justify-between py-3 mb-2">
          <View>
            <Text className="text-[10px] font-black uppercase tracking-widest text-[#AF2219]">
              Total Net Worth
            </Text>
            <Text className="text-2xl font-black text-stone-900 tabular-nums tracking-tight">
              {wallets.length > 0 ? formatCents(netWorthCents) : "PHP 0.00"}
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

        {/* Wallets Section */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-black uppercase tracking-wider text-stone-600">
            Accounts & Wallets
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
                  {showAddWallet ? "Cancel" : "+ Add"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Empty Wallet State */}
        {wallets.length === 0 && !showAddWallet ? (
          <View className="bg-white rounded-2xl p-6 border border-stone-200 mb-5 items-center shadow-2xs">
            <View className="h-16 w-16 rounded-2xl bg-[#AF221915] border-2 border-[#AF221930] items-center justify-center mb-3">
              <MaterialIcons name="account-balance-wallet" size={32} color="#AF2219" />
            </View>
            <Text className="text-base font-black text-stone-900 text-center mb-1">
              Create Your First Wallet
            </Text>
            <Text className="text-xs text-stone-500 font-medium text-center leading-relaxed mb-4">
              Add a wallet to start tracking your spending{"\n"}and dealing damage to bosses!
            </Text>
            <Pressable
              onPress={() => setShowAddWallet(true)}
              className="h-[44px] px-6 rounded-xl bg-[#AF2219] items-center justify-center active:bg-[#8F1E2C] shadow-xs"
            >
              <Text className="text-white font-bold text-sm">+ Create Wallet</Text>
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
                    ? "bg-white border-[#AF2219] shadow-xs"
                    : "bg-white border-stone-200"
                    }`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-xs font-bold text-stone-600">{w.name}</Text>
                    <View
                      style={{ backgroundColor: w.color }}
                      className="w-2.5 h-2.5 rounded-full"
                    />
                  </View>
                  <Text
                    className={`text-base font-black tabular-nums ${w.balance < 0 ? "text-[#AF2219]" : "text-stone-900"
                      }`}
                  >
                    {formatCents(w.balance)}
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
          <View className="bg-white rounded-2xl p-4 border border-[#AF221930] mb-5 shadow-2xs">
            <Text className="text-xs font-black uppercase tracking-wider text-stone-600 mb-3">
              New Wallet
            </Text>
            <TextInput
              value={newWalletName}
              onChangeText={setNewWalletName}
              placeholder="Wallet name (e.g. Daily Cash)"
              placeholderTextColor="#8B8988"
              className="h-[44px] px-3 rounded-xl border border-stone-200 bg-[#FAF8F6] text-sm font-medium text-stone-900 mb-3"
            />
            <Text className="text-[11px] font-bold text-stone-500 mb-2">Type</Text>
            <View className="flex-row gap-2 mb-3">
              {WALLET_TYPES.map((wt) => (
                <Pressable
                  key={wt.value}
                  onPress={() => setNewWalletType(wt.value)}
                  className={`px-3 py-1.5 rounded-lg border ${newWalletType === wt.value
                    ? "bg-[#AF2219] border-[#AF2219]"
                    : "bg-white border-stone-200"
                    }`}
                >
                  <Text className={`text-xs font-bold ${newWalletType === wt.value ? "text-white" : "text-stone-600"}`}>
                    {wt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-[11px] font-bold text-stone-500 mb-2">Color</Text>
            <View className="flex-row gap-2.5 mb-4">
              {WALLET_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setNewWalletColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full ${newWalletColor === c ? "border-2 border-stone-900" : "border border-stone-200"}`}
                />
              ))}
            </View>
            <Pressable
              onPress={handleAddWallet}
              disabled={!isWalletValid}
              className={`h-[44px] rounded-xl items-center justify-center ${isWalletValid
                ? "bg-[#AF2219] active:bg-[#8F1E2C]"
                : "bg-stone-200"
                }`}
            >
              <Text className={`font-bold text-sm ${isWalletValid ? "text-white" : "text-stone-400"}`}>
                Create Wallet
              </Text>
            </Pressable>
          </View>
        )}

        {/* Category Budget Status */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-black uppercase tracking-wider text-stone-600">
            Monthly Budgets
          </Text>
        </View>

        {categories.length === 0 ? (
          <View className="bg-white rounded-2xl p-6 border border-stone-200 mb-5 items-center shadow-2xs">
            <View className="h-14 w-14 rounded-2xl bg-[#AF221915] border border-[#AF221930] items-center justify-center mb-3">
              <MaterialIcons name="category" size={28} color="#AF2219" />
            </View>
            <Text className="text-sm font-black text-stone-900 text-center mb-1">
              Set Up Budget Categories
            </Text>
            <Text className="text-xs text-stone-500 font-medium text-center leading-relaxed mb-4">
              Categories help you track spending habits{"\n"}and fight bosses more effectively.
            </Text>
            <Pressable
              onPress={handleQuickAddCategories}
              className="h-[44px] px-6 rounded-xl bg-[#AF2219] items-center justify-center active:bg-[#8F1E2C] shadow-xs"
            >
              <Text className="text-white font-bold text-sm">+ Quick Setup (4 Categories)</Text>
            </Pressable>
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-4 border border-stone-200 mb-5 shadow-2xs">
            {categories.map((c) => {
              const spentCents = transactions
                .filter((t) => t.category_id === c.id)
                .reduce((sum, t) => sum + t.amount, 0);
              const cap = c.budget_cap ?? 500000;
              const progress = Math.min(100, Math.round((spentCents / cap) * 100));

              return (
                <View key={c.id} className="mb-3 last:mb-0">
                  <View className="flex-row justify-between items-center mb-1">
                    <View className="flex-row items-center gap-2">
                      <MaterialIcons name={c.icon as any} size={16} color="#AF2219" />
                      <Text className="text-xs font-bold text-stone-800">{c.name}</Text>
                    </View>
                    <Text className="text-xs font-black text-stone-800 tabular-nums">
                      {formatCents(spentCents)} / {formatCents(cap)}
                    </Text>
                  </View>
                  <View className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                    <View
                      style={{
                        width: `${progress}%`,
                        backgroundColor: progress > 85 ? "#AF2219" : "#3C9B55",
                        height: "100%",
                        borderRadius: 999,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Transaction History */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-black uppercase tracking-wider text-stone-600">
            Recent Ledger Entries
          </Text>
          <Text className="text-xs font-bold text-stone-400">
            {filteredTransactions.length} logs
          </Text>
        </View>

        <View className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
          {filteredTransactions.length === 0 ? (
            <View className="p-8 items-center justify-center gap-2">
              <Text className="text-xs font-bold text-stone-400 text-center">
                {wallets.length === 0
                  ? "Create a wallet to start logging transactions."
                  : categories.length === 0
                  ? "Set up budget categories to start logging."
                  : "No transactions recorded yet."}
              </Text>
              {wallets.length === 0 ? (
                <Pressable
                  onPress={() => setShowAddWallet(true)}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#AF2219] active:bg-[#8F1E2C] flex-row items-center gap-1.5 shadow-xs"
                >
                  <MaterialIcons name="add" size={14} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">Create First Wallet</Text>
                </Pressable>
              ) : categories.length === 0 ? (
                <Pressable
                  onPress={handleQuickAddCategories}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#AF2219] active:bg-[#8F1E2C] flex-row items-center gap-1.5 shadow-xs"
                >
                  <MaterialIcons name="category" size={14} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">Setup Categories</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => router.push("/quick-log")}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#AF221915] border border-[#AF221940] active:bg-[#AF221925] flex-row items-center gap-1.5"
                >
                  <MaterialIcons name="flash-on" size={14} color="#AF2219" />
                  <Text className="text-xs font-bold text-[#AF2219]">Quick Log Expense</Text>
                </Pressable>
              )}
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
                  className={`p-3.5 flex-row items-center justify-between ${!isLast ? "border-b border-stone-100" : ""
                    }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 rounded-xl bg-[#AF221915] border border-[#AF221930] items-center justify-center">
                      <MaterialIcons
                        name={(cat?.icon ?? "receipt") as any}
                        size={18}
                        color="#AF2219"
                      />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-stone-800">{tx.note || cat?.name || "Expense"}</Text>
                      <Text className="text-[10px] text-stone-400 font-medium">{dateStr}</Text>
                    </View>
                  </View>
                  <Text className="text-sm font-black text-[#AF2219] tabular-nums">
                    -{formatCents(tx.amount)}
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
