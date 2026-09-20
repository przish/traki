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
      <View className="flex-1 justify-between items-center px-6 pt-6 pb-4 max-w-[420px] w-full self-center">
        {/* Hero Branding - Naturally balanced in upper-middle viewport */}
        <View className="items-center justify-center flex-1 my-auto">
          <Pressable
            className="items-center justify-center active:scale-95 transition-transform"
            onPress={handleStart}
          >
            <Image
              source={require("../../assets/images/logos/traki-logo.png")}
              style={{ width: 170, height: 170 }}
              className="w-[170px] h-[170px]"
              resizeMode="contain"
            />
          </Pressable>
          <Text className="text-[#AF2219] text-2xl font-black tracking-tight mt-3">
            Traki
          </Text>
          <Text className="text-stone-500 text-xs font-semibold text-center mt-1">
            Turn Personal Budgeting Into an Epic Duo Quest
          </Text>
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
