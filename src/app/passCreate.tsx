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
import { SafeAreaView } from "react-native-safe-area-context";
import { isValidPassword, doPasswordsMatch } from "@/src/constants";

export default function PassCreate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isPasswordValid = isValidPassword(password);
  const doMatch = doPasswordsMatch(password, confirmPassword);
  const canSubmit = isPasswordValid && doMatch;

  const getValidationHint = () => {
    if (password.length > 0 && !isPasswordValid) {
      return "Password must be at least 6 characters";
    }
    if (confirmPassword.length > 0 && !doMatch) {
      return "Passwords do not match";
    }
    return "";
  };

  const errorText = getValidationHint();

  const handleFinish = () => {
    if (!canSubmit || isLoading) return;
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
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "space-between",
            paddingHorizontal: 24,
            paddingTop: 4,
            paddingBottom: 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View className="w-full max-w-[420px] self-center flex-1 justify-between">
            {/* Top Area: Navigation, Branding, Header, Form */}
            <View className="w-full">
              <BackButton />

              <View className="items-center my-1">
                <Logo size={74} className="my-1" />
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
              </View>
            </View>

            {/* Bottom Action Button */}
            <View className="w-full pt-4 pb-2">
              <Continue
                title="Unlock Traki Quest"
                disabled={!canSubmit || isLoading}
                loading={isLoading}
                onPress={handleFinish}
              />
            </View>
          </View>
        </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}