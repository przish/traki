import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Continue from "@/components/continue";

export default function QuickLogModal() {
  const isDark = useColorScheme() === "dark";
  const { wallets, categories, logTransaction } = useTraki();

  const [amountStr, setAmountStr] = useState("0");
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id ?? "w_hero_vault");
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id ?? "c_coffee");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleKeyPress = (val: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}

    if (val === "backspace") {
      setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
    } else if (val === ".") {
      if (!amountStr.includes(".")) {
        setAmountStr((prev) => prev + ".");
      }
    } else {
      setAmountStr((prev) => (prev === "0" ? val : prev + val));
    }
  };

  const handleStrike = async () => {
    const num = parseFloat(amountStr);
    if (!num || num <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    const selectedCategory = categories.find((c) => c.id === selectedCatId);
    const logNote = `Resisted ${selectedCategory?.name || "Impulse Buy"}`;

    await logTransaction(amountStr, selectedCatId, selectedWalletId, logNote);
    setIsSubmitting(false);
    handleClose();
  };

  const KEYPAD = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "backspace"],
  ];

  return (
    <ScreenContainer className="px-5 pt-3">
      {/* Modal Top Bar */}
      <View className={`flex-row items-center justify-between pb-3 border-b ${isDark ? "border-[#303336]" : "border-stone-200"}`}>
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 rounded-lg bg-[#AF2219] items-center justify-center shadow-xs">
            <MaterialIcons name="shield" size={16} color="#FFFFFF" />
          </View>
          <Text className={`text-base font-black ${isDark ? "text-white" : "text-stone-900"}`}>
            Log Resisted Impulse (Savings)
          </Text>
        </View>
        <Pressable
          onPress={handleClose}
          className={`h-8 w-8 rounded-full border items-center justify-center ${isDark ? "bg-[#1B1D1F] border-[#303336] active:bg-[#25282B]" : "bg-white border-stone-200 active:bg-stone-100"}`}
        >
          <MaterialIcons name="close" size={18} color={isDark ? "#AAA7A5" : "#8B8988"} />
        </Pressable>
      </View>

      {/* Amount Display */}
      <View className="py-4 items-center">
        <Text className="text-[10px] font-black uppercase tracking-widest text-[#AF2219] mb-1">
          Money Saved (Deals Cleave Damage)
        </Text>
        <View className="flex-row items-baseline gap-1.5">
          <Text className={`text-2xl font-black ${isDark ? "text-stone-500" : "text-stone-400"}`}>PHP</Text>
          <Text className={`text-5xl font-black tabular-nums tracking-tight ${isDark ? "text-white" : "text-stone-900"}`}>
            {amountStr}
          </Text>
        </View>
      </View>

      {/* 1-Tap Category Selector */}
      <View className="mb-3">
        <Text className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
          Temptation Resisted
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {categories.map((c) => {
            const isSelected = selectedCatId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setSelectedCatId(c.id)}
                className={`px-3 py-2 rounded-xl flex-row items-center gap-1.5 border ${
                  isSelected
                    ? "bg-[#AF2219] border-[#AF2219] shadow-xs"
                    : isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-stone-200"
                }`}
              >
                <MaterialIcons
                  name={c.icon as any}
                  size={15}
                  color={isSelected ? "#FFFFFF" : "#AF2219"}
                />
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? "text-white" : isDark ? "text-stone-200" : "text-stone-700"
                  }`}
                >
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Vault Destination Selector */}
      <View className="mb-4">
        <Text className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-stone-400" : "text-stone-500"}`}>
          Savings Vault Destination
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {wallets.map((w) => {
            const isSelected = selectedWalletId === w.id;
            return (
              <Pressable
                key={w.id}
                onPress={() => setSelectedWalletId(w.id)}
                className={`px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5 ${
                  isSelected
                    ? isDark ? "bg-[#25282B] border-[#AF2219] shadow-xs" : "bg-white border-[#AF2219] shadow-xs"
                    : isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-stone-200"
                }`}
              >
                <View
                  style={{ backgroundColor: w.color }}
                  className="w-2 h-2 rounded-full"
                />
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? "text-[#AF2219]" : isDark ? "text-stone-400" : "text-stone-600"
                  }`}
                >
                  {w.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Tactile Keypad */}
      <View className="flex-1 justify-center max-h-[260px] mb-4">
        {KEYPAD.map((row, rIdx) => (
          <View key={rIdx} className="flex-row gap-2 mb-2 flex-1">
            {row.map((btn) => (
              <Pressable
                key={btn}
                onPress={() => handleKeyPress(btn)}
                className={`flex-1 rounded-2xl border items-center justify-center shadow-2xs ${
                  isDark
                    ? "bg-[#1B1D1F] border-[#303336] active:bg-[#AF221925]"
                    : "bg-white border-stone-200 active:bg-[#AF221915]"
                }`}
              >
                {btn === "backspace" ? (
                  <MaterialIcons name="backspace" size={20} color="#AF2219" />
                ) : (
                  <Text className={`text-xl font-black tabular-nums ${isDark ? "text-white" : "text-stone-800"}`}>
                    {btn}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      {/* Strike Action Button */}
      <View className="mb-4">
        <Continue
          title={`⚔️ Unleash Savings Strike (₱${amountStr})`}
          disabled={parseFloat(amountStr) <= 0}
          loading={isSubmitting}
          onPress={handleStrike}
        />
      </View>
    </ScreenContainer>
  );
}
