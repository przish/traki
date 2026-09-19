import React, { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { useColors } from "@/hooks/use-colors";

interface ShopItem {
  id: string;
  title: string;
  detail: string;
  price: number;
  icon: string;
  tone: string;
  rewardType: "shield" | "multiplier";
}

const ITEMS: ShopItem[] = [
  {
    id: "item_shield",
    title: "Streak Shield",
    detail: "Consumes automatically to preserve streak if you miss 1 day",
    price: 500,
    icon: "shield",
    tone: "#EAE5F4",
    rewardType: "shield",
  },
  {
    id: "item_charm",
    title: "Critical Strike Charm",
    detail: "Boosts strike damage and combat cleaves by +15%",
    price: 800,
    icon: "bolt",
    tone: "#FBE8E6",
    rewardType: "multiplier",
  },
  {
    id: "item_elixir",
    title: "Budget Potion",
    detail: "Awards 50 EXP and temporary +25% Gold drop multiplier",
    price: 350,
    icon: "science",
    tone: "#FFF1D7",
    rewardType: "multiplier",
  },
];

export default function ShopScreen() {
  const { profile, buyShopItem } = useTraki();
  const colors = useColors();
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleBuy = async (item: ShopItem) => {
    if (!profile || profile.gold < item.price) {
      setToastMsg({
        type: "error",
        text: `Insufficient Gold! You need ${item.price} Gold. Defeat daily mobs to earn more.`,
      });
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const success = await buyShopItem(item.title, item.price, item.rewardType);
    if (success) {
      setToastMsg({
        type: "success",
        text: `Acquired ${item.title}! Your gear is updated.`,
      });
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="py-3 mb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
              Arcade Merchant
            </Text>
            <Text className="text-2xl font-black text-foreground">Item Shop</Text>
          </View>

          <View className="flex-row items-center gap-1.5 bg-[#FFF1D7] dark:bg-[#382B14] px-3 py-1.5 rounded-full border border-[#F1B64A]/40 shadow-2xs">
            <MaterialIcons name="monetization-on" size={16} color="#F1B64A" />
            <Text className="text-xs font-black text-[#A87610] dark:text-[#F6CA78]">
              {profile?.gold ?? 0} Gold
            </Text>
          </View>
        </View>

        {/* Feedback Toast */}
        {toastMsg && (
          <View
            className={`p-3.5 rounded-2xl mb-4 border ${
              toastMsg.type === "success"
                ? "bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800"
            }`}
          >
            <Text
              className={`text-xs font-bold text-center ${
                toastMsg.type === "success" ? "text-green-800 dark:text-green-300" : "text-primary"
              }`}
            >
              {toastMsg.text}
            </Text>
          </View>
        )}

        {/* Available Items */}
        <Text className="text-xs font-extrabold uppercase tracking-wider text-muted mb-2.5">
          Combat Gear & Shields
        </Text>

        <View className="gap-3 mb-6">
          {ITEMS.map((item) => {
            const canAfford = (profile?.gold ?? 0) >= item.price;

            return (
              <View
                key={item.id}
                className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between shadow-2xs"
              >
                <View className="flex-row items-center gap-3 flex-1 pr-3">
                  <View
                    style={{ backgroundColor: item.tone }}
                    className="h-11 w-11 rounded-2xl items-center justify-center shadow-2xs"
                  >
                    <MaterialIcons name={item.icon as any} size={22} color="#171717" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-black text-foreground">{item.title}</Text>
                    <Text className="text-[11px] text-muted leading-tight mt-0.5">{item.detail}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => handleBuy(item)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: canAfford ? colors.primary : colors.border,
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    },
                  ]}
                  className="px-3.5 py-2.5 rounded-xl items-center justify-center min-w-[80px]"
                >
                  <Text
                    className={`text-xs font-black ${
                      canAfford ? "text-white" : "text-muted"
                    }`}
                  >
                    {item.price} G
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Streak Shield Status Banner */}
        <View className="bg-canvas border border-border rounded-2xl p-4 flex-row items-center gap-3 shadow-2xs">
          <View className="h-11 w-11 rounded-2xl bg-primary/10 items-center justify-center">
            <MaterialIcons name="shield" size={24} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-black text-foreground">
              Active Streak Shields: {profile?.streak_shields ?? 0}
            </Text>
            <Text className="text-[11px] text-muted leading-relaxed mt-0.5">
              Streak shields automatically protect your habit streak and combat multipliers if you ever miss a daily log!
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
