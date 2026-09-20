import React, { useState } from "react";
import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/src/context/AuthContext";
import { AuthProviderType } from "@/src/types";

export interface LoginMethodsProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function LoginMethods({ onSuccess, onError }: LoginMethodsProps) {
  const router = useRouter();
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithSandbox,
    isAuthenticating,
  } = useAuth();
  const [activeButtonLoading, setActiveButtonLoading] = useState<AuthProviderType | null>(null);

  const handleProviderPress = async (provider: AuthProviderType) => {
    if (isAuthenticating || activeButtonLoading) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setActiveButtonLoading(provider);

    try {
      let result;
      if (provider === "google") {
        result = await signInWithGoogle();
      } else if (provider === "apple") {
        result = await signInWithApple();
      } else {
        result = await signInWithSandbox("stingray");
      }

      if (result.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
        if (onSuccess) {
          onSuccess();
        } else {
          router.replace("/(tabs)");
        }
      } else if (result.cancelled) {
        // User dismissed the native sheet or browser session - clean exit
      } else if (result.error && onError) {
        onError(result.error);
      }
    } catch (err: any) {
      if (onError) {
        onError(err?.message || `${provider} authentication encountered an error.`);
      }
    } finally {
      setActiveButtonLoading(null);
    }
  };

  const isGoogleLoading = activeButtonLoading === "google";
  const isAppleLoading = activeButtonLoading === "apple";
  const isStingrayLoading = activeButtonLoading === "stingray";
  const isDisabled = isAuthenticating || activeButtonLoading !== null;

  return (
    <View className="gap-2.5 w-full">
      {/* Google SSO Button - Triggers expo-web-browser */}
      <Pressable
        disabled={isDisabled}
        className={`flex-row items-center justify-center gap-2.5 w-full border border-[#A13024]/40 bg-white rounded-xl h-[42px] active:bg-[#AF221908] ${
          isDisabled ? "opacity-60" : ""
        }`}
        onPress={() => handleProviderPress("google")}
      >
        {isGoogleLoading ? (
          <ActivityIndicator size="small" color="#AF2219" />
        ) : (
          <>
            <Image
              source={require("../assets/images/logos/google.png")}
              className="w-4 h-4"
              resizeMode="contain"
            />
            <Text className="text-center font-bold text-stone-800 text-sm">
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>

      {/* Apple SSO Button - Triggers expo-apple-authentication */}
      <Pressable
        disabled={isDisabled}
        className={`flex-row items-center justify-center gap-2.5 w-full border border-[#A13024]/40 bg-white rounded-xl h-[42px] active:bg-[#AF221908] ${
          isDisabled ? "opacity-60" : ""
        }`}
        onPress={() => handleProviderPress("apple")}
      >
        {isAppleLoading ? (
          <ActivityIndicator size="small" color="#AF2219" />
        ) : (
          <>
            <Image
              source={require("../assets/images/logos/apple-logo.png")}
              className="w-4 h-4"
              resizeMode="contain"
            />
            <Text className="text-center font-bold text-stone-800 text-sm">
              Continue with Apple
            </Text>
          </>
        )}
      </Pressable>

      {/* Stingray Developer SSO Button */}
      <Pressable
        disabled={isDisabled}
        className={`flex-row items-center justify-center gap-2.5 w-full border border-[#A13024]/40 bg-white rounded-xl h-[42px] active:bg-[#AF221908] ${
          isDisabled ? "opacity-60" : ""
        }`}
        onPress={() => handleProviderPress("stingray")}
      >
        {isStingrayLoading ? (
          <ActivityIndicator size="small" color="#AF2219" />
        ) : (
          <>
            <Image
              source={require("../assets/images/logos/dev-logo.png")}
              className="w-8 h-4"
              resizeMode="contain"
            />
            <Text className="text-center font-bold text-stone-800 text-sm">
              Continue with Stingray
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}