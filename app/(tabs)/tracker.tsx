import React, { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { useColors } from "@/hooks/use-colors";
import { formatCents } from "@/src/services/economyService";

export default function TrackerScreen() {
  const { wallets, transactions, categories } = useTraki();
  const colors = useColors();
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
            <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
              Total Net Worth
            </Text>
            <Text className="text-2xl font-black text-foreground tabular-nums tracking-tight">
              {formatCents(netWorthCents)}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/quick-log")}
            className="h-10 w-10 rounded-2xl bg-primary items-center justify-center shadow-sm"
          >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Wallets & Accounts (Interactive Filters) */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-extrabold uppercase tracking-wider text-muted">
            Accounts & Wallets
          </Text>
          {selectedWalletId && (
            <Pressable onPress={() => setSelectedWalletId(null)}>
              <Text className="text-xs font-bold text-primary">Clear filter</Text>
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
                    ? "bg-surface border-primary shadow-sm"
                    : "bg-surface border-border"
                }`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-bold text-muted">{w.name}</Text>
                  <View
                    style={{ backgroundColor: w.color }}
                    className="w-2.5 h-2.5 rounded-full"
                  />
                </View>
                <Text
                  className={`text-base font-black tabular-nums ${
                    w.balance < 0 ? "text-primary" : "text-foreground"
                  }`}
                >
                  {formatCents(w.balance)}
                </Text>
                {isSelected && (
                  <Text className="text-[10px] font-bold text-primary mt-1">
                    Filtered
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Category Budget Status */}
        <Text className="text-xs font-extrabold uppercase tracking-wider text-muted mb-2.5">
          Monthly Budgets
        </Text>
        <View className="bg-surface rounded-2xl p-4 border border-border mb-5">
          {categories.map((c) => {
            const spentCents = transactions
              .filter((t) => t.category_id === c.id)
              .reduce((sum, t) => sum + t.amount, 0);
            const cap = c.budget_cap ?? 500000;
            const percent = Math.min(100, Math.round((spentCents / cap) * 100));
            const isOver = spentCents > cap;

            return (
              <View key={c.id} className="mb-3.5 last:mb-0">
                <View className="flex-row justify-between items-center mb-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-xs font-bold text-foreground">{c.name}</Text>
                    {isOver && (
                      <View className="bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded">
                        <Text className="text-[9px] font-bold text-primary">Over Cap</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-[11px] font-semibold text-muted tabular-nums">
                    {formatCents(spentCents)} / {formatCents(cap)}
                  </Text>
                </View>
                <View className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <View
                    style={{
                      width: `${percent}%`,
                      backgroundColor: isOver ? colors.primary : colors.success,
                      height: "100%",
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Ledger Transactions */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-extrabold uppercase tracking-wider text-muted">
            Recent Activity & Strikes
          </Text>
          <Text className="text-xs text-muted font-medium">
            {filteredTransactions.length} logs
          </Text>
        </View>

        <View className="bg-surface rounded-2xl border border-border overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <View className="p-8 items-center justify-center">
              <MaterialIcons name="receipt-long" size={32} color={colors.muted} />
              <Text className="text-xs font-bold text-muted mt-2">
                No transactions found for this view
              </Text>
            </View>
          ) : (
            filteredTransactions.map((tx, idx) => {
              const cat = categories.find((c) => c.id === tx.category_id);
              const wallet = wallets.find((w) => w.id === tx.wallet_id);
              const dateStr = new Date(tx.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <View
                  key={tx.id}
                  className={`p-3.5 flex-row items-center justify-between ${
                    idx !== filteredTransactions.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 rounded-2xl bg-canvas border border-border items-center justify-center">
                      <MaterialIcons
                        name={(cat?.icon as any) ?? "receipt"}
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">{tx.note}</Text>
                      <Text className="text-[11px] text-muted">
                        {cat?.name ?? "General"} • {wallet?.name ?? "Cash"} • {dateStr}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-sm font-black tabular-nums text-foreground">
                      -{formatCents(tx.amount)}
                    </Text>
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <MaterialIcons name="flash-on" size={11} color={colors.primary} />
                      <Text className="text-[10px] font-bold text-primary">Strike Deal</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
