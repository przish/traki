import React, { useState } from "react";
import {
  Pressable,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Logo from "../../components/logo";
import TextField from "../../components/text-field";
import Continue from "../../components/continue";
import ORdivider from "../../components/ORdivider";
import LoginMethods from "../../components/LoginMethods";

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = () => {
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
        <Logo />

        <View className="my-2">
          <Text className="text-[#AF2219] text-2xl font-black tracking-tight">
            Welcome Back
          </Text>
          <Text className="text-stone-500 text-xs text-center font-medium mt-0.5">
            Log in to continue your habit quest
          </Text>
        </View>

        <View className="w-full gap-3 mt-4">
          <View className="gap-1.5">
            <Text className="text-stone-700 text-xs font-bold uppercase tracking-wider">
              Email or Username
            </Text>
            <TextField
              placeholder="e.g. hunter@traki.app"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-stone-700 text-xs font-bold uppercase tracking-wider">
              Password
            </Text>
            <View className="relative justify-center">
              <TextField
                placeholder="Enter your secret pass"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                className="pr-12"
              />
              <Pressable
                onPress={toggleShowPassword}
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

          <View className="items-end py-1">
            <Pressable
              onPress={() => {
                router.push("/resetPassword");
              }}
            >
              <Text className="text-xs font-bold text-[#AF2219]">
                Forgot password?
              </Text>
            </Pressable>
          </View>

          <Continue
            title="Log In & Battle"
            loading={isLoading}
            onPress={handleLogin}
          />

          <ORdivider />

          <LoginMethods onSuccess={() => router.replace("/(tabs)")} />
        </View>

        <View className="mt-8">
          <Pressable
            onPress={() => {
              router.replace("/signUp");
            }}
          >
            {({ pressed }) => (
              <Text
                className={`text-[#AF2219] text-sm font-semibold ${
                  pressed ? "underline opacity-80" : ""
                }`}
              >
                No account yet? <Text className="font-bold underline">Sign Up</Text>
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
