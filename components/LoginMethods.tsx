import React, { useState } from "react";
import { View, Text, Image, Pressable, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/src/context/AuthContext";
import { AuthProviderType } from "@/src/types";
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
    signInWithSandbox,
    signInWithCustomAccount,
    isAuthenticating,
  } = useAuth();

  const [activeButtonLoading, setActiveButtonLoading] = useState<AuthProviderType | null>(null);
  const [ssoModalProvider, setSsoModalProvider] = useState<"google" | "apple" | null>(null);

  const handleProviderPress = async (provider: AuthProviderType) => {
    if (isAuthenticating || activeButtonLoading) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    // Stingray dev login
    if (provider === "stingray") {
      setActiveButtonLoading(provider);
      try {
        const result = await signInWithSandbox("stingray");
        if (result.success) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          if (onSuccess) {
            onSuccess();
          } else {
            router.replace("/(tabs)");
          }
        }
      } catch (err: any) {
        if (onError) onError(err?.message || "Stingray sign in failed.");
      } finally {
        setActiveButtonLoading(null);
      }
      return;
    }

    // Apple SSO Button Click
    if (provider === "apple") {
      const isAvailable = await isAppleAuthAvailable();

      // If native Apple Sign-In is genuinely available (physical iOS device with Apple ID),
      // invoke the native sheet. If on Simulator, Web, Android, or if native sheet fails,
      // present the interactive Apple SSO modal sheet.
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
          } else {
            console.log("Native Apple auth returned error, falling back to SSO modal:", result.error);
          }
        } catch (err) {
          console.log("Native Apple auth unavailable, falling back to SSO modal:", err);
        } finally {
          setActiveButtonLoading(null);
        }
      }

      // Pop up the Apple SSO modal sheet
      setSsoModalProvider("apple");
      return;
    }

    // Google SSO Button Click
    if (provider === "google") {
      // If real OAuth credentials are confirmed and ready, try the OAuth flow
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
          } else if (result.error) {
            console.log("Google OAuth failed, falling back to SSO modal:", result.error);
          }
        } catch (err) {
          console.log("Google OAuth unavailable, opening SSO modal:", err);
        } finally {
          setActiveButtonLoading(null);
        }
      }

      // Pop up the Google SSO modal sheet for interactive account selection
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
        onError(err?.message || "Failed to sign in with chosen account.");
      }
    }
  };

  const isDark = useColorScheme() === "dark";
  const isGoogleLoading = activeButtonLoading === "google";
  const isAppleLoading = activeButtonLoading === "apple";
  const isStingrayLoading = activeButtonLoading === "stingray";
  const isDisabled = isAuthenticating || activeButtonLoading !== null;

  return (
    <View className="gap-2.5 w-full">
      {/* Google SSO Button - Opens Google SSO Sheet / Modal */}
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

      {/* Apple SSO Button - Opens Apple SSO Sheet / Modal */}
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

      {/* Stingray Developer SSO Button */}
      <Pressable
        disabled={isDisabled}
        className={`flex-row items-center justify-center gap-2.5 w-full border rounded-xl h-[42px] active:bg-[#AF221908] ${
          isDark ? "bg-[#1B1D1F] border-[#303336]" : "bg-white border-[#A13024]/40"
        } ${isDisabled ? "opacity-60" : ""}`}
        onPress={() => handleProviderPress("stingray")}
      >
        {isStingrayLoading ? (
          <ActivityIndicator size="small" color={THEME_CONFIG.COLORS.BRAND} />
        ) : (
          <View pointerEvents="none" className="flex-row items-center justify-center gap-2.5">
            <Image
              source={require("../assets/images/logos/dev-logo.png")}
              style={{ width: 32, height: 18 }}
              className="w-8 h-4"
              resizeMode="contain"
            />
            <Text className={`text-center font-bold text-sm ${isDark ? "text-white" : "text-stone-800"}`}>
              Continue with Stingray
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