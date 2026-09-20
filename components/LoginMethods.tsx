import React from "react";
import { View, Text, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

export interface LoginMethodsProps {
  onSuccess?: () => void;
}

export default function LoginMethods({ onSuccess }: LoginMethodsProps) {
  const router = useRouter();

  const handleProviderLogin = (provider: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    if (onSuccess) {
      onSuccess();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View className="gap-2.5 w-full">
      <Pressable
        className="flex-row items-center justify-center gap-2.5 w-full border border-[#A13024]/40 bg-white rounded-xl h-[42px] active:bg-[#AF221908]"
        onPress={() => handleProviderLogin("google")}
      >
        <Image
          source={require("../assets/images/logos/google.png")}
          className="w-4 h-4"
          resizeMode="contain"
        />
        <Text className="text-center font-bold text-stone-800 text-sm">
          Continue with Google
        </Text>
      </Pressable>

      <Pressable
        className="flex-row items-center justify-center gap-2.5 w-full border border-[#A13024]/40 bg-white rounded-xl h-[42px] active:bg-[#AF221908]"
        onPress={() => handleProviderLogin("apple")}
      >
        <Image
          source={require("../assets/images/logos/apple-logo.png")}
          className="w-4 h-4"
          resizeMode="contain"
        />
        <Text className="text-center font-bold text-stone-800 text-sm">
          Continue with Apple
        </Text>
      </Pressable>

      <Pressable
        className="flex-row items-center justify-center gap-2.5 w-full border border-[#A13024]/40 bg-white rounded-xl h-[42px] active:bg-[#AF221908]"
        onPress={() => handleProviderLogin("stingray")}
      >
        <Image
          source={require("../assets/images/logos/dev-logo.png")}
          className="w-8 h-4"
          resizeMode="contain"
        />
        <Text className="text-center font-bold text-stone-800 text-sm">
          Continue with Stingray
        </Text>
      </Pressable>
    </View>
  );
}