import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { useColors } from "@/hooks/use-colors";

export default function QuickLogModal() {
  const { wallets, categories, logTransaction } = useTraki();
  const colors = useColors();

  const [amountStr, setAmountStr] = useState("0");
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id ?? "w_cash");
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id ?? "c_food");
  const [note, setNote] = useState("Quick Expense");

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
    if (!num || num <= 0) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    await logTransaction(amountStr, selectedCatId, selectedWalletId, note);
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
      <View className="flex-row items-center justify-between pb-3 border-b border-border">
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 rounded-lg bg-primary items-center justify-center">
            <MaterialIcons name="flash-on" size={16} color="#FFFFFF" />
          </View>
          <Text className="text-base font-black text-foreground">3-Sec Quick Log</Text>
        </View>
        <Pressable
          onPress={handleClose}
          className="h-8 w-8 rounded-full bg-surface border border-border items-center justify-center"
        >
          <MaterialIcons name="close" size={18} color={colors.muted} />
        </Pressable>
      </View>

      {/* Amount Display */}
      <View className="py-5 items-center">
        <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted mb-1">
          Amount to Log & Strike
        </Text>
        <View className="flex-row items-baseline gap-1">
          <Text className="text-2xl font-black text-muted">PHP</Text>
          <Text className="text-5xl font-black text-foreground tabular-nums tracking-tight">
            {amountStr}
          </Text>
        </View>
      </View>

      {/* 1-Tap Category Selector */}
      <View className="mb-3">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
          Select Category
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {categories.map((c) => {
            const isSelected = selectedCatId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  setSelectedCatId(c.id);
                  setNote(c.name);
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                }}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <MaterialIcons
                  name={(c.icon as any) ?? "label"}
                  size={15}
                  color={isSelected ? "#FFFFFF" : colors.foreground}
                />
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? "text-white" : "text-foreground"
                  }`}
                >
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 1-Tap Wallet Selector */}
      <View className="mb-4">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
          Source Wallet
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
          {wallets.map((w) => {
            const isSelected = selectedWalletId === w.id;
            return (
              <Pressable
                key={w.id}
                onPress={() => {
                  setSelectedWalletId(w.id);
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                }}
                className={`px-3 py-1.5 rounded-xl border ${
                  isSelected
                    ? "bg-foreground border-foreground"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? "text-background" : "text-foreground"
                  }`}
                >
                  {w.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Numeric Keypad */}
      <View className="flex-1 justify-center gap-2 mb-4">
        {KEYPAD.map((row, rIdx) => (
          <View key={rIdx} className="flex-row gap-2 justify-center">
            {row.map((val) => (
              <Pressable
                key={val}
                onPress={() => handleKeyPress(val)}
                style={({ pressed }) => [
                  styles.keypadKey,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && { opacity: 0.6 },
                ]}
              >
                {val === "backspace" ? (
                  <MaterialIcons name="backspace" size={22} color={colors.foreground} />
                ) : (
                  <Text className="text-2xl font-black text-foreground">{val}</Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      {/* Strike Action Button */}
      <Pressable
        onPress={handleStrike}
        style={({ pressed }) => [
          styles.strikeBtn,
          { backgroundColor: colors.primary },
          pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        ]}
      >
        <MaterialIcons name="sports-martial-arts" size={22} color="#FFFFFF" />
        <Text className="text-white font-black text-base tracking-wider">
          STRIKE & LOG EXPENSE
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keypadKey: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  strikeBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    shadowColor: "#D92C3B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
