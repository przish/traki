import React from "react";
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

  const netWorthCents = wallets.reduce((sum, w) => sum + w.balance, 0);

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between py-3 mb-2">
          <View>
            <Text className="text-xs font-bold uppercase tracking-wider text-muted">Total Net Worth</Text>
            <Text className="text-2xl font-black text-foreground tabular-nums">
              {formatCents(netWorthCents)}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/quick-log")}
            className="h-10 w-10 rounded-full bg-primary items-center justify-center shadow-sm"
          >
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Wallets Carousel / Grid */}
        <Text className="text-xs font-extrabold uppercase tracking-wider text-muted mb-3">
          Wallets & Accounts
        </Text>
        <View className="flex-row flex-wrap gap-2.5 mb-5">
          {wallets.map((w) => (
            <View
              key={w.id}
              className="bg-surface border border-border p-3.5 rounded-2xl flex-1 min-w-[140px]"
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
            </View>
          ))}
        </View>

        {/* Category Budget Status */}
        <Text className="text-xs font-extrabold uppercase tracking-wider text-muted mb-3">
          Monthly Budgets
        </Text>
        <View className="bg-surface rounded-2xl p-4 border border-border mb-5">
          {categories.map((c) => {
            const spentCents = transactions
              .filter((t) => t.category_id === c.id)
              .reduce((sum, t) => sum + t.amount, 0);
            const cap = c.budget_cap ?? 500000;
            const percent = Math.min(100, Math.round((spentCents / cap) * 100));

            return (
              <View key={c.id} className="mb-3.5 last:mb-0">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs font-bold text-foreground">{c.name}</Text>
                  <Text className="text-[11px] font-semibold text-muted tabular-nums">
                    {formatCents(spentCents)} / {formatCents(cap)}
                  </Text>
                </View>
                <View className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <View
                    style={{
                      width: `${percent}%`,
                      backgroundColor: percent > 90 ? colors.primary : colors.success,
                      height: "100%",
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Ledger Transactions */}
        <Text className="text-xs font-extrabold uppercase tracking-wider text-muted mb-3">
          Recent Activity & Combat Strikes
        </Text>
        <View className="bg-surface rounded-2xl border border-border overflow-hidden">
          {transactions.length === 0 ? (
            <View className="p-6 items-center">
              <Text className="text-xs text-muted">No transactions logged yet. Strike your first mob!</Text>
            </View>
          ) : (
            transactions.map((tx, idx) => {
              const cat = categories.find((c) => c.id === tx.category_id);
              const dateStr = new Date(tx.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <View
                  key={tx.id}
                  className={`p-3.5 flex-row items-center justify-between ${
                    idx !== transactions.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 rounded-xl bg-canvas border border-border items-center justify-center">
                      <MaterialIcons
                        name={(cat?.icon as any) ?? "receipt"}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View>
                      <Text className="text-sm font-bold text-foreground">{tx.note}</Text>
                      <Text className="text-[11px] text-muted">
                        {cat?.name ?? "General"} • {dateStr}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-sm font-bold tabular-nums text-foreground">
                      -{formatCents(tx.amount)}
                    </Text>
                    <Text className="text-[10px] font-semibold text-primary">Strike Deal</Text>
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
