import React from "react";
import { View, Text } from "react-native";

export default function ORdivider() {
  return (
    <View className="flex-row items-center w-full my-2">
      <View className="flex-1 h-[1px] bg-stone-200" />
      <Text className="mx-3 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
        or
      </Text>
      <View className="flex-1 h-[1px] bg-stone-200" />
    </View>
  );
}