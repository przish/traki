import React, { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { formatCents } from "@/src/services/economyService";

export default function TrackerScreen() {
  const { wallets, transactions, categories } = useTraki();
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  const netWorthCents = wallets.reduce((sum, w) => sum + w.balance, 0);

  const filteredTransactions = selectedWalletId
    ? transactions.filter((t) => t.wallet_id === selectedWalletId)
    : transactions;

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header with Net Worth */}
        <View className="flex-row items-center justify-between py-3 mb-2">
          <View>
            <Text className="text-[10px] font-black uppercase tracking-widest text-[#AF2219]">
              Total Net Worth
            </Text>
            <Text className="text-2xl font-black text-stone-900 tabular-nums tracking-tight">
              {formatCents(netWorthCents)}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/quick-log")}
            className="h-10 w-10 rounded-2xl bg-[#AF2219] items-center justify-center shadow-xs active:bg-[#8F1E2C]"
          >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Wallets & Accounts (Interactive Filters) */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-black uppercase tracking-wider text-stone-600">
            Accounts & Wallets
          </Text>
          {selectedWalletId && (
            <Pressable onPress={() => setSelectedWalletId(null)}>
              <Text className="text-xs font-bold text-[#AF2219]">Clear filter</Text>
            </Pressable>
          )}
        </View>

        <View className="flex-row flex-wrap gap-2.5 mb-5">
          {wallets.map((w) => {
            const isSelected = selectedWalletId === w.id;
            return (
              <Pressable
                key={w.id}
                onPress={() => setSelectedWalletId(isSelected ? null : w.id)}
                className={`p-3.5 rounded-2xl flex-1 min-w-[140px] border ${
                  isSelected
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
                  className={`text-base font-black tabular-nums ${
                    w.balance < 0 ? "text-[#AF2219]" : "text-stone-900"
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

        {/* Category Budget Status */}
        <Text className="text-xs font-black uppercase tracking-wider text-stone-600 mb-2.5">
          Monthly Budgets
        </Text>
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
            <View className="p-8 items-center justify-center">
              <Text className="text-xs font-bold text-stone-400">
                No transactions recorded yet. Tap + to log one!
              </Text>
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
                  className={`p-3.5 flex-row items-center justify-between ${
                    !isLast ? "border-b border-stone-100" : ""
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
