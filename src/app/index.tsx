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

  const handleLogin = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push("/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1 justify-between items-center px-6 pt-6 pb-6 max-w-[420px] w-full self-center">
        {/* Hero Branding - Centered Sword Logo (Logo self-contains title & slogan) */}
        <View className="items-center justify-center flex-1 my-auto">
          <Pressable
            className="items-center justify-center active:scale-95 transition-transform"
            onPress={handleStart}
          >
            <Image
              source={require("../../assets/images/logos/traki-logo.png")}
              style={{ width: 190, height: 190 }}
              className="w-[190px] h-[190px]"
              resizeMode="contain"
            />
          </Pressable>
        </View>

        {/* Bottom Actions */}
        <View className="w-full gap-3 pb-2">
          <Continue
            title="Start Your Quest"
            onPress={handleStart}
          />

          <Pressable
            onPress={handleLogin}
            className="h-[46px] w-full items-center justify-center rounded-xl bg-[#AF221915] border border-[#AF221940] active:bg-[#AF221925]"
          >
            <Text className="text-[#AF2219] font-bold text-sm">
              I Already Have an Account
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
