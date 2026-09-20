import React from "react";
import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Continue from "../../components/continue";

export default function Index() {
  const router = useRouter();

  const handleStart = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    router.push("/signUp");
  };

  const handleDirectDemo = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 justify-between items-center px-6 py-4 max-w-[420px] w-full self-center">
        {/* Spacer to keep center balance */}
        <View className="h-2" />

        {/* Perfectly Centered Hero Logo */}
        <View className="items-center justify-center my-auto">
          <Pressable
            className="items-center justify-center active:scale-95 transition-transform"
            onPress={handleStart}
          >
            <Image
              source={require("../../assets/images/logos/traki-logo.png")}
              className="w-[180px] h-[180px]"
              resizeMode="contain"
            />
          </Pressable>
        </View>

        {/* Bottom Actions with Crisp Alignment */}
        <View className="w-full gap-2.5 pb-2">
          <Continue
            title="Start Your Quest"
            onPress={handleStart}
          />

          <Pressable
            onPress={() => router.push("/login")}
            className="h-[44px] w-full items-center justify-center rounded-xl bg-[#AF221915] border border-[#AF221940] active:bg-[#AF221925]"
          >
            <Text className="text-[#AF2219] font-bold text-sm">
              I Already Have an Account
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDirectDemo}
            className="items-center py-2"
          >
            <Text className="text-stone-400 text-xs font-semibold underline">
              Jump Straight In (Quick Demo)
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
