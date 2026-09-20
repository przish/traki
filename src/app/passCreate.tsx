import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import TextField from "../../components/text-field";
import Logo from "../../components/logo";
import Continue from "../../components/continue";
import BackButton from "../../components/back-button";

export default function PassCreate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleFinish = () => {
    if (password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword) {
      setErrorText("Passwords do not match");
      return;
    }
    setErrorText("");
    setIsLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setTimeout(() => {
      setIsLoading(false);
      router.replace("/(tabs)");
    }, 400);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          paddingHorizontal: 28,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BackButton />
        <Logo />

        <View className="my-2">
          <Text className="text-[#AF2219] text-2xl font-black tracking-tight text-center">
            Create Secret Pass
          </Text>
          <Text className="text-stone-500 text-xs text-center font-medium mt-0.5">
            Secure your hero vault with a battle passcode
          </Text>
        </View>

        <View className="w-full gap-3 mt-4">
          <View className="gap-1.5">
            <Text className="text-stone-700 text-xs font-bold uppercase tracking-wider">
              Password
            </Text>
            <View className="relative justify-center">
              <TextField
                placeholder="Choose a strong pass"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                className="pr-12"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 h-full justify-center"
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#AF2219"
                />
              </Pressable>
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-stone-700 text-xs font-bold uppercase tracking-wider">
              Re-enter Password
            </Text>
            <TextField
              placeholder="Confirm secret pass"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {errorText ? (
            <Text className="text-xs font-bold text-red-600">{errorText}</Text>
          ) : null}

          <View className="mt-2">
            <Continue
              title="Unlock Traki Quest"
              loading={isLoading}
              onPress={handleFinish}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}