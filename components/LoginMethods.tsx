import React, { useState } from "react";
import { View, Text, Image, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/src/context/AuthContext";
import { isAppleAuthAvailable } from "@/src/services/authService";
import { AuthProviderType } from "@/src/types";
import SSOModal from "./SSOModal";

export interface LoginMethodsProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function LoginMethods({ onSuccess, onError }: LoginMethodsProps) {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple, signInWithCustomAccount, isAuthenticating } = useAuth();
  const [modalProvider, setModalProvider] = useState<"google" | "apple" | "stingray" | null>(null);
  const [activeButtonLoading, setActiveButtonLoading] = useState<AuthProviderType | null>(null);

  const handleProviderPress = async (provider: AuthProviderType) => {
    if (isAuthenticating) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    // For Apple on iOS with native entitlement, launch native Apple Sign In sheet directly
    if (provider === "apple") {
      setActiveButtonLoading("apple");
      const hasNativeApple = await isAppleAuthAvailable();
      setActiveButtonLoading(null);

      if (hasNativeApple) {
        const result = await signInWithApple({ allowSandbox: false });
        if (result.success) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          if (onSuccess) onSuccess();
          else router.replace("/(tabs)");
          return;
        } else if (result.cancelled) {
          return;
        }
        // If native failed or was unavailable, fall through to SSOModal popup
      }
    }

    // For Google, check if live Google OAuth Client ID is configured
    if (provider === "google") {
      const hasGoogleClientId = !!(
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      );
      if (hasGoogleClientId) {
        setActiveButtonLoading("google");
        const result = await signInWithGoogle({ allowSandbox: false });
        setActiveButtonLoading(null);
        if (result.success) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          if (onSuccess) onSuccess();
          else router.replace("/(tabs)");
          return;
        } else if (result.cancelled) {
          return;
        }
      }
    }

    // Always pop up the authentic SSO dialog sheet
    setModalProvider(provider as "google" | "apple" | "stingray");
  };

  const handleModalAuthenticate = async (account: {
    email: string;
    displayName: string;
    avatarUrl?: string;
    provider: "google" | "apple" | "stingray";
  }) => {
    const result = await signInWithCustomAccount(account);

    if (result.success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      if (onSuccess) {
        onSuccess();
      } else {
        router.replace("/(tabs)");
      }
    } else if (result.error && onError) {
      onError(result.error);
    }
  };

  const isGoogleLoading = activeButtonLoading === "google";
  const isAppleLoading = activeButtonLoading === "apple";
  const isStingrayLoading = activeButtonLoading === "stingray";

  return (
    <View className="gap-2.5 w-full">
      {/* Google SSO Button */}
      <Pressable
        disabled={isAuthenticating}
        className={`flex-row items-center justify-center gap-2.5 w-full border border-[#A13024]/40 bg-white rounded-xl h-[42px] active:bg-[#AF221908] ${
          isAuthenticating ? "opacity-60" : ""
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

      {/* Apple SSO Button */}
      <Pressable
        disabled={isAuthenticating}
        className={`flex-row items-center justify-center gap-2.5 w-full border border-[#A13024]/40 bg-white rounded-xl h-[42px] active:bg-[#AF221908] ${
          isAuthenticating ? "opacity-60" : ""
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
        disabled={isAuthenticating}
        className={`flex-row items-center justify-center gap-2.5 w-full border border-[#A13024]/40 bg-white rounded-xl h-[42px] active:bg-[#AF221908] ${
          isAuthenticating ? "opacity-60" : ""
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

      {/* Interactive SSO Pop-up Modal Sheet */}
      <SSOModal
        visible={modalProvider !== null}
        provider={modalProvider}
        onClose={() => setModalProvider(null)}
        onSelectAccount={handleModalAuthenticate}
      />
    </View>
  );
}