import React, { useState } from "react";
import { View, Text, Image, Pressable, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/src/context/AuthContext";
import { AuthProviderType } from "@/src/types";
import { isAppleAuthAvailable, isGoogleOAuthReady } from "@/src/services/authService";
import { THEME_CONFIG } from "@/src/constants";
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
      // If real OAuth credentials are configured, try the browser OAuth flow
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
          console.log("Google OAuth unavailable, opening SSO modal:", err);
        } finally {
          setActiveButtonLoading(null);
        }
      }

      // Pop up the Google SSO modal sheet
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

  const isGoogleLoading = activeButtonLoading === "google";
  const isAppleLoading = activeButtonLoading === "apple";
  const isStingrayLoading = activeButtonLoading === "stingray";
  const isDisabled = isAuthenticating || activeButtonLoading !== null;

  return (
    <View className="gap-2.5 w-full">
      {/* Google SSO Button - Opens Google SSO Sheet / Modal */}
      <Pressable
        disabled={isDisabled}
        className={`flex-row items-center justify-center gap-2.5 w-full border border-[#A13024]/40 bg-white rounded-xl h-[42px] active:bg-[#AF221908] ${
          isDisabled ? "opacity-60" : ""
        }`}
        onPress={() => handleProviderPress("google")}
      >
        {isGoogleLoading ? (
          <ActivityIndicator size="small" color={THEME_CONFIG.COLORS.BRAND} />
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

      {/* Apple SSO Button - Opens Apple SSO Sheet / Modal */}
      <Pressable
        disabled={isDisabled}
        className={`flex-row items-center justify-center gap-2.5 w-full border border-[#A13024]/40 bg-white rounded-xl h-[42px] active:bg-[#AF221908] ${
          isDisabled ? "opacity-60" : ""
        }`}
        onPress={() => handleProviderPress("apple")}
      >
        {isAppleLoading ? (
          <ActivityIndicator size="small" color={THEME_CONFIG.COLORS.BRAND} />
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
          <ActivityIndicator size="small" color={THEME_CONFIG.COLORS.BRAND} />
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