import React, { useState } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface ShopItem {
  id: string;
  title: string;
  detail: string;
  price: number;
  icon: string;
  rewardType: "shield" | "multiplier";
}

const ITEMS: ShopItem[] = [
  {
    id: "item_shield",
    title: "Streak Shield",
    detail: "Automatically consumes to preserve your streak if you miss 1 day",
    price: 500,
    icon: "shield",
    rewardType: "shield",
  },
  {
    id: "item_charm",
    title: "Critical Strike Charm",
    detail: "Boosts strike damage and combat cleaves by +15%",
    price: 800,
    icon: "bolt",
    rewardType: "multiplier",
  },
  {
    id: "item_elixir",
    title: "Budget Potion",
    detail: "Awards 50 EXP and temporary +25% Gold drop multiplier",
    price: 350,
    icon: "science",
    rewardType: "multiplier",
  },
];

export default function ShopScreen() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const { profile, buyShopItem } = useTraki();
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
        text: `Acquired ${item.title}! Your inventory has been updated.`,
      });
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="py-3 mb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] font-black uppercase tracking-widest text-[#AF2219]">
              Arcade Merchant
            </Text>
            <Text className={`text-2xl font-black ${isDark ? "text-white" : "text-stone-900"}`}>Item Shop</Text>
          </View>

          <View className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-2xs ${isDark ? "bg-[#25282B] border-[#F1B64A]/40" : "bg-[#FFF1D7] border-[#F1B64A]/50"}`}>
            <MaterialIcons name="monetization-on" size={16} color="#C4880E" />
            <Text className={`text-xs font-black ${isDark ? "text-[#F1B64A]" : "text-[#A87610]"}`}>
              {profile?.gold ?? 0} Gold
            </Text>
          </View>
        </View>

        {/* Feedback Toast */}
        {toastMsg && (
          <View
            className={`p-3.5 rounded-2xl mb-4 border ${
              toastMsg.type === "success"
                ? "bg-[#C9E7D2] border-[#3C9B55]/40"
                : "bg-[#AF221915] border-[#AF221940]"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                toastMsg.type === "success" ? "text-[#1C5E2D]" : "text-[#AF2219]"
              }`}
            >
              {toastMsg.text}
            </Text>
          </View>
        )}

        {/* Active Inventory Highlights */}
        <View className={`rounded-2xl p-4 border mb-5 shadow-2xs ${isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-[#AF221930]"}`}>
          <Text className={`text-xs font-black uppercase tracking-wide mb-3 ${isDark ? "text-white" : "text-stone-900"}`}>
            Equipped Gear & Protections
          </Text>
          <View className="flex-row gap-3">
            <View className={`flex-1 p-3 rounded-xl border items-center ${isDark ? "bg-[#AF221920] border-[#AF221940]" : "bg-[#AF221915] border-[#AF221930]"}`}>
              <MaterialIcons name="shield" size={22} color="#AF2219" />
              <Text className="text-lg font-black text-[#AF2219] mt-1">
                {profile?.streak_shields ?? 1}
              </Text>
              <Text className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-stone-400" : "text-stone-600"}`}>
                Streak Shields
              </Text>
            </View>

            <View className={`flex-1 p-3 rounded-xl border items-center ${isDark ? "bg-[#25282B] border-[#F1B64A]/30" : "bg-[#FFF1D7] border-[#F1B64A]/40"}`}>
              <MaterialIcons name="local-fire-department" size={22} color="#C4880E" />
              <Text className={`text-lg font-black mt-1 ${isDark ? "text-[#F1B64A]" : "text-[#A87610]"}`}>
                {profile?.current_streak ?? 1}x
              </Text>
              <Text className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-stone-400" : "text-stone-600"}`}>
                Streak Multiplier
              </Text>
            </View>
          </View>
        </View>

        {/* Shop Items Catalog */}
        <Text className={`text-xs font-black uppercase tracking-wider mb-2.5 ${isDark ? "text-stone-400" : "text-stone-600"}`}>
          Arcade Supplies
        </Text>

        <View className="gap-3 mb-5">
          {ITEMS.map((item) => {
            const canAfford = (profile?.gold ?? 0) >= item.price;
            return (
              <View
                key={item.id}
                className={`rounded-2xl p-4 border shadow-2xs ${isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-stone-200"}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-3 flex-1 pr-3">
                    <View className="h-11 w-11 rounded-xl bg-[#AF221915] border border-[#AF221930] items-center justify-center">
                      <MaterialIcons name={item.icon as any} size={22} color="#AF2219" />
                    </View>
                    <View className="flex-1">
                      <Text className={`text-sm font-black ${isDark ? "text-white" : "text-stone-900"}`}>{item.title}</Text>
                      <Text className={`text-xs mt-0.5 leading-relaxed font-medium ${isDark ? "text-stone-400" : "text-stone-500"}`}>
                        {item.detail}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleBuy(item)}
                    className={`px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 shadow-2xs ${
                      canAfford ? "bg-[#AF2219] active:bg-[#8F1E2C]" : isDark ? "bg-stone-800" : "bg-stone-200"
                    }`}
                  >
                    <MaterialIcons
                      name="monetization-on"
                      size={14}
                      color={canAfford ? "#FFFFFF" : isDark ? "#707579" : "#8B8988"}
                    />
                    <Text
                      className={`text-xs font-black ${
                        canAfford ? "text-white" : isDark ? "text-stone-500" : "text-stone-500"
                      }`}
                    >
                      {item.price}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {/* Battle Arena CTA banner for gold farming */}
        <View className={`border rounded-2xl p-4 flex-row items-center justify-between shadow-2xs mb-5 ${isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-[#AF221908] border-[#AF221920]"}`}>
          <View className="flex-1 pr-3">
            <Text className={`text-xs font-black ${isDark ? "text-white" : "text-stone-900"}`}>Need More Gold?</Text>
            <Text className={`text-[11px] font-medium mt-0.5 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
              Defeat daily mobs and log expenses in the Battle Arena to earn bounties!
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)")}
            className="px-3.5 py-2 rounded-xl bg-[#AF2219] items-center justify-center active:bg-[#8F1E2C]"
          >
            <Text className="text-xs font-bold text-white">Battle Now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
