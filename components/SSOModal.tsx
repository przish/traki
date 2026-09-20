import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface SSOModalProps {
  visible: boolean;
  provider: "google" | "apple" | "stingray" | null;
  onClose: () => void;
  onSelectAccount: (account: {
    email: string;
    displayName: string;
    avatarUrl?: string;
    provider: "google" | "apple" | "stingray";
  }) => Promise<void>;
}

export default function SSOModal({
  visible,
  provider,
  onClose,
  onSelectAccount,
}: SSOModalProps) {
  const [customEmail, setCustomEmail] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [appleHideEmail, setAppleHideEmail] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!provider) return null;

  const isGoogle = provider === "google";
  const isApple = provider === "apple";
  const isStingray = provider === "stingray";

  const handleAccountPress = async (account: {
    email: string;
    displayName: string;
    avatarUrl?: string;
  }) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    await onSelectAccount({
      ...account,
      provider,
    });
    setIsProcessing(false);
    onClose();
  };

  const handleCustomSubmit = async () => {
    if (!customEmail.trim() || isProcessing) return;
    const name = customEmail.split("@")[0].replace(/[._]/g, " ");
    const formattedName =
      name.charAt(0).toUpperCase() + name.slice(1) || (isGoogle ? "Google User" : "Apple User");

    await handleAccountPress({
      email: customEmail.trim(),
      displayName: formattedName,
      avatarUrl: isGoogle ? "https://lh3.googleusercontent.com/a/default-user" : undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/60"
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-9 shadow-2xl border-t border-stone-200">
          {/* Header Bar Handle */}
          <View className="items-center -mt-2 mb-4">
            <View className="w-12 h-1.5 bg-stone-300 rounded-full" />
          </View>

          {/* Modal Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-stone-100">
            <View className="flex-row items-center gap-3">
              {isGoogle && (
                <Image
                  source={require("../assets/images/logos/google.png")}
                  className="w-6 h-6"
                  resizeMode="contain"
                />
              )}
              {isApple && (
                <Image
                  source={require("../assets/images/logos/apple-logo.png")}
                  className="w-6 h-6"
                  resizeMode="contain"
                />
              )}
              {isStingray && (
                <Image
                  source={require("../assets/images/logos/dev-logo.png")}
                  className="w-10 h-5"
                  resizeMode="contain"
                />
              )}
              <View>
                <Text className="text-base font-black text-stone-900">
                  {isGoogle
                    ? "Sign in with Google"
                    : isApple
                    ? "Sign in with Apple"
                    : "Stingray Developer SSO"}
                </Text>
                <Text className="text-[11px] text-stone-500 font-medium">
                  {isGoogle
                    ? "Choose an account to continue to Traki"
                    : isApple
                    ? "traki.app would like to use your Apple ID"
                    : "Instant developer sandbox authorization"}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              disabled={isProcessing}
              className="p-1 rounded-full active:bg-stone-100"
            >
              <MaterialCommunityIcons name="close" size={22} color="#8B8988" />
            </Pressable>
          </View>

          {isProcessing ? (
            <View className="py-12 items-center justify-center gap-3">
              <ActivityIndicator size="large" color="#AF2219" />
              <Text className="text-xs font-bold text-stone-600">
                Authorizing session with {isGoogle ? "Google" : isApple ? "Apple" : "Stingray"}...
              </Text>
            </View>
          ) : (
            <View className="mt-4 gap-3">
              {/* GOOGLE SSO CONTENT */}
              {isGoogle && (
                <>
                  <Pressable
                    onPress={() =>
                      handleAccountPress({
                        email: "irishpureza@gmail.com",
                        displayName: "Irish Pureza",
                        avatarUrl: "https://lh3.googleusercontent.com/a/default-user",
                      })
                    }
                    className="flex-row items-center gap-3 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl active:bg-stone-100"
                  >
                    <View className="w-10 h-10 rounded-full bg-[#AF221915] border border-[#AF221940] items-center justify-center">
                      <Text className="text-base font-black text-[#AF2219]">IP</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-stone-900">Irish Pureza</Text>
                      <Text className="text-xs text-stone-500">irishpureza@gmail.com</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#8B8988" />
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      handleAccountPress({
                        email: "hunter.traki@gmail.com",
                        displayName: "Traki Hunter",
                        avatarUrl: "https://lh3.googleusercontent.com/a/default-user",
                      })
                    }
                    className="flex-row items-center gap-3 p-3.5 bg-stone-50 border border-stone-200 rounded-2xl active:bg-stone-100"
                  >
                    <View className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 items-center justify-center">
                      <Text className="text-base font-black text-blue-700">TH</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-stone-900">Traki Hunter</Text>
                      <Text className="text-xs text-stone-500">hunter.traki@gmail.com</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#8B8988" />
                  </Pressable>

                  {showCustomInput ? (
                    <View className="p-3 bg-stone-50 border border-stone-200 rounded-2xl gap-2.5">
                      <Text className="text-xs font-bold text-stone-700">Enter your Google Email:</Text>
                      <TextInput
                        value={customEmail}
                        onChangeText={setCustomEmail}
                        placeholder="yourname@gmail.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoFocus
                        className="bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-stone-900"
                      />
                      <Pressable
                        onPress={handleCustomSubmit}
                        className="bg-[#AF2219] h-[40px] rounded-xl items-center justify-center active:opacity-90"
                      >
                        <Text className="text-white font-bold text-sm">Continue with this Account</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setShowCustomInput(true)}
                      className="flex-row items-center justify-center gap-2 py-2"
                    >
                      <MaterialCommunityIcons name="account-plus-outline" size={18} color="#AF2219" />
                      <Text className="text-xs font-bold text-[#AF2219]">Use another Google account</Text>
                    </Pressable>
                  )}
                </>
              )}

              {/* APPLE SSO CONTENT */}
              {isApple && (
                <>
                  <View className="p-4 bg-stone-50 border border-stone-200 rounded-2xl gap-3">
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full bg-black items-center justify-center">
                        <Image
                          source={require("../assets/images/logos/apple-logo.png")}
                          className="w-5 h-5 tint-white"
                          style={{ tintColor: "#FFFFFF" }}
                          resizeMode="contain"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-black text-stone-900">Irish Pureza</Text>
                        <Text className="text-xs text-stone-500 font-medium">Apple Account</Text>
                      </View>
                    </View>

                    {/* Email Privacy Toggle */}
                    <View className="pt-2 border-t border-stone-200 gap-2">
                      <Text className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                        Email Privacy:
                      </Text>

                      <Pressable
                        onPress={() => setAppleHideEmail(false)}
                        className={`flex-row items-center justify-between p-2.5 rounded-xl border ${
                          !appleHideEmail
                            ? "bg-white border-[#AF2219] shadow-2xs"
                            : "border-transparent"
                        }`}
                      >
                        <View>
                          <Text className="text-xs font-bold text-stone-900">Share My Email</Text>
                          <Text className="text-[11px] text-stone-500">irishpureza@icloud.com</Text>
                        </View>
                        {!appleHideEmail && (
                          <MaterialCommunityIcons name="check-circle" size={18} color="#AF2219" />
                        )}
                      </Pressable>

                      <Pressable
                        onPress={() => setAppleHideEmail(true)}
                        className={`flex-row items-center justify-between p-2.5 rounded-xl border ${
                          appleHideEmail
                            ? "bg-white border-[#AF2219] shadow-2xs"
                            : "border-transparent"
                        }`}
                      >
                        <View>
                          <Text className="text-xs font-bold text-stone-900">Hide My Email</Text>
                          <Text className="text-[11px] text-stone-500">
                            irish.relay@privaterelay.appleid.com
                          </Text>
                        </View>
                        {appleHideEmail && (
                          <MaterialCommunityIcons name="check-circle" size={18} color="#AF2219" />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {/* Apple Action Button */}
                  <Pressable
                    onPress={() =>
                      handleAccountPress({
                        email: appleHideEmail
                          ? "irish.relay@privaterelay.appleid.com"
                          : "irishpureza@icloud.com",
                        displayName: "Irish Pureza",
                      })
                    }
                    className="flex-row items-center justify-center gap-2 bg-black h-[46px] rounded-2xl active:opacity-90 shadow-xs"
                  >
                    <Image
                      source={require("../assets/images/logos/apple-logo.png")}
                      className="w-4 h-4"
                      style={{ tintColor: "#FFFFFF" }}
                      resizeMode="contain"
                    />
                    <Text className="text-white font-bold text-sm">
                      Continue with Face ID / Passcode
                    </Text>
                  </Pressable>
                </>
              )}

              {/* STINGRAY SSO CONTENT */}
              {isStingray && (
                <>
                  <View className="p-4 bg-stone-50 border border-stone-200 rounded-2xl gap-2">
                    <Text className="text-xs text-stone-600 font-medium">
                      Authenticate with internal Stingray dev credentials to unlock debugging perks and developer vault access.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      handleAccountPress({
                        email: "stingray.dev@traki.app",
                        displayName: "Stingray Master",
                      })
                    }
                    className="bg-[#AF2219] h-[46px] rounded-2xl items-center justify-center active:opacity-90 shadow-xs"
                  >
                    <Text className="text-white font-bold text-sm">
                      Authorize Developer Session
                    </Text>
                  </Pressable>
                </>
              )}

              {/* Footer Notice */}
              <View className="pt-2">
                <Text className="text-[10px] text-center text-stone-400 font-medium leading-tight">
                  By continuing, you authorize Traki to connect your quest profile with your{" "}
                  {isGoogle ? "Google" : isApple ? "Apple" : "Stingray"} identity.
                </Text>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
