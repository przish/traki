import React, { useState } from "react";
import { View, Text, Image, Pressable, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/src/context/AuthContext";
import { isAppleAuthAvailable, isGoogleOAuthReady } from "@/src/services/authService";
import { THEME_CONFIG } from "@/src/constants";
import { useColorScheme } from "@/hooks/use-color-scheme";
import SSOModal, { SelectedSSOAccount } from "./SSOModal";

export interface LoginMethodsProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function LoginMethods({ onSuccess, onError }: LoginMethodsProps) {
  const router = useRouter();
  const {
    signInWithGoogle,
    signInWithApple,
    signInWithCustomAccount,
    isAuthenticating,
  } = useAuth();

  const [activeButtonLoading, setActiveButtonLoading] = useState<"google" | "apple" | null>(null);
  const [ssoModalProvider, setSsoModalProvider] = useState<"google" | "apple" | null>(null);

  const handleProviderPress = async (provider: "google" | "apple") => {
    if (isAuthenticating || activeButtonLoading) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    // Apple SSO Button Click
    if (provider === "apple") {
      const isAvailable = await isAppleAuthAvailable();

      if (isAvailable && Platform.OS === "ios") {
        setActiveButtonLoading("apple");
        try {
          const result = await signInWithApple({ allowSandbox: false });
          if (result.success) {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
            if (onSuccess) {
              onSuccess();
            } else {
              router.replace("/(tabs)");
            }
            return;
          } else if (result.cancelled) {
            return;
          }
        } catch (err) {
          console.log("Native Apple auth unavailable, falling back to modal:", err);
        } finally {
          setActiveButtonLoading(null);
        }
      }

      setSsoModalProvider("apple");
      return;
    }

    // Google SSO Button Click
    if (provider === "google") {
      if (isGoogleOAuthReady()) {
        setActiveButtonLoading("google");
        try {
          const result = await signInWithGoogle({ allowSandbox: false });
          if (result.success) {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
            if (onSuccess) {
              onSuccess();
            } else {
              router.replace("/(tabs)");
            }
            return;
          } else if (result.cancelled) {
            return;
          }
        } catch (err) {
          console.log("Google OAuth unavailable, opening modal:", err);
        } finally {
          setActiveButtonLoading(null);
        }
      }

      setSsoModalProvider("google");
      return;
    }
  };

  const handleModalSelectAccount = async (account: SelectedSSOAccount) => {
    try {
      const result = await signInWithCustomAccount(account);
      if (result.success) {
        setSsoModalProvider(null);
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
    } catch (err: any) {
      if (onError) {
        onError(err?.message || "Failed to sign in with account.");
      }
    }
  };

  const isDark = useColorScheme() === "dark";
  const isGoogleLoading = activeButtonLoading === "google";
  const isAppleLoading = activeButtonLoading === "apple";
  const isDisabled = isAuthenticating || activeButtonLoading !== null;

  return (
    <View className="gap-2.5 w-full">
      {/* Google SSO Button */}
      <Pressable
        disabled={isDisabled}
        className={`flex-row items-center justify-center gap-2.5 w-full border rounded-xl h-[42px] active:bg-[#AF221908] ${
          isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-[#A13024]/40"
        } ${isDisabled ? "opacity-60" : ""}`}
        onPress={() => handleProviderPress("google")}
      >
        {isGoogleLoading ? (
          <ActivityIndicator size="small" color={THEME_CONFIG.COLORS.BRAND} />
        ) : (
          <View pointerEvents="none" className="flex-row items-center justify-center gap-2.5">
            <Image
              source={require("../assets/images/logos/google.png")}
              style={{ width: 18, height: 18 }}
              className="w-4 h-4"
              resizeMode="contain"
            />
            <Text className={`text-center font-bold text-sm ${isDark ? "text-white" : "text-stone-800"}`}>
              Continue with Google
            </Text>
          </View>
        )}
      </Pressable>

      {/* Apple SSO Button */}
      <Pressable
        disabled={isDisabled}
        className={`flex-row items-center justify-center gap-2.5 w-full border rounded-xl h-[42px] active:bg-[#AF221908] ${
          isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-[#A13024]/40"
        } ${isDisabled ? "opacity-60" : ""}`}
        onPress={() => handleProviderPress("apple")}
      >
        {isAppleLoading ? (
          <ActivityIndicator size="small" color={THEME_CONFIG.COLORS.BRAND} />
        ) : (
          <View pointerEvents="none" className="flex-row items-center justify-center gap-2.5">
            <Image
              source={require("../assets/images/logos/apple-logo.png")}
              style={{ width: 18, height: 18, tintColor: isDark ? "#FFFFFF" : undefined }}
              className="w-4 h-4"
              resizeMode="contain"
            />
            <Text className={`text-center font-bold text-sm ${isDark ? "text-white" : "text-stone-800"}`}>
              Continue with Apple
            </Text>
          </View>
        )}
      </Pressable>

      {/* Interactive SSO Account Chooser Modal */}
      <SSOModal
        visible={ssoModalProvider !== null}
        provider={ssoModalProvider}
        onClose={() => setSsoModalProvider(null)}
        onSelectAccount={handleModalSelectAccount}
      />
    </View>
  );
}