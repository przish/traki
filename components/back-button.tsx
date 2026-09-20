import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { View, type GestureResponderEvent, Pressable } from "react-native";
import * as Haptics from "expo-haptics";

type BackButtonProps = {
  onPress?: (event: GestureResponderEvent) => void;
};

export default function BackButton({ onPress }: BackButtonProps) {
  const handlePress = (e: GestureResponderEvent) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (onPress) {
      onPress(e);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <View className="w-full mt-2 mb-1">
      <Pressable
        onPress={handlePress}
        className="items-center justify-center bg-[#AF221915] active:bg-[#AF221930] w-10 h-10 rounded-full border border-[#AF221930]"
      >
        <MaterialIcons name="arrow-back" color="#AF2219" size={20} />
      </Pressable>
    </View>
  );
}