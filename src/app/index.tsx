import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Image, Pressable, View } from "react-native";

export default function Index() {
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnimation]);

  return (
    <View className="flex-1 justify-center items-center bg-white gap-2">
      <Pressable
        className="justify-center items-center"
        onPress={() => {
          console.log("continue pressed");
          router.replace("./signUp");
        }}
      >
        <View className="flex-1 justify-center">
          <Image
            source={require("../.././assets/images/logos/traki-logo.png")}
            className="w-[240] h-[240]"
          />
        </View>

        <View className="flex-2 mb-10">
          <Animated.Text
            className="text-[#AF2219] font-bold"
            style={{ opacity: fadeAnimation }}
          >
            click anywhere to continue
          </Animated.Text>
        </View>
      </Pressable>
    </View>
  );
}
