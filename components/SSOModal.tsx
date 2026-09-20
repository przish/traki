import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { AUTH_CONFIG, THEME_CONFIG } from "../src/constants";

export interface SelectedSSOAccount {
  id?: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: "google" | "apple" | "stingray";
}

export interface SSOModalProps {
  visible: boolean;
  provider: "google" | "apple" | null;
  onClose: () => void;
  onSelectAccount: (account: SelectedSSOAccount) => Promise<void>;
}

export default function SSOModal({
  visible,
  provider,
  onClose,
  onSelectAccount,
}: SSOModalProps) {
  const [loading, setLoading] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [appleEmailChoice, setAppleEmailChoice] = useState<"share" | "hide">("share");

  if (!visible || !provider) return null;

  const isGoogle = provider === "google";

  const handleAccountClick = async (account: SelectedSSOAccount) => {
    if (loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setLoading(true);
    try {
      await onSelectAccount(account);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async () => {
    const email = customEmail.trim();
    if (!email || !email.includes("@")) return;

    const name = customName.trim() || email.split("@")[0];
    await handleAccountClick({
      email,
      displayName: name,
      provider: isGoogle ? "google" : "apple",
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/60 justify-end sm:justify-center items-center p-0 sm:p-4"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-stone-200 overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Grabber bar for mobile sheets */}
          <View className="items-center mb-3 sm:hidden">
            <View className="w-12 h-1.5 bg-stone-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-stone-100 mb-4">
            <View className="flex-row items-center gap-2.5">
              <Image
                source={
                  isGoogle
                    ? require("../assets/images/logos/google.png")
                    : require("../assets/images/logos/apple-logo.png")
                }
                style={{ width: 24, height: 24 }}
                className="w-6 h-6"
                resizeMode="contain"
              />
              <Text className="text-base font-bold text-stone-900">
                {isGoogle ? "Sign in with Google" : "Sign in with Apple ID"}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              disabled={loading}
              className="p-1 rounded-full hover:bg-stone-100 active:bg-stone-200"
            >
              <Ionicons name="close" size={20} color="#78716C" />
            </Pressable>
          </View>

          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {isGoogle ? (
              /* Google SSO Account Chooser */
              <View className="gap-3">
                <Text className="text-xs text-stone-500 font-medium mb-1">
                  Choose an account to continue to <Text className="font-bold text-stone-800">Traki</Text>
                </Text>

                {AUTH_CONFIG.DEMO_ACCOUNTS.GOOGLE.map((acc) => (
                  <Pressable
                    key={acc.id}
                    disabled={loading}
                    onPress={() =>
                      handleAccountClick({
                        id: acc.id,
                        email: acc.email,
                        displayName: acc.displayName,
                        avatarUrl: acc.avatarUrl,
                        provider: "google",
                      })
                    }
                    className="flex-row items-center p-3 rounded-xl border border-stone-200 bg-stone-50 active:bg-stone-100"
                  >
                    <View
                      className={`w-10 h-10 rounded-full ${acc.colorClass} items-center justify-center mr-3`}
                    >
                      <Text className="text-white font-bold text-base">{acc.initial}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-stone-900">{acc.displayName}</Text>
                      <Text className="text-xs text-stone-500">{acc.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#A8A29E" />
                  </Pressable>
                ))}

                {/* Option 3: Use another account toggle */}
                {!showCustomForm ? (
                  <Pressable
                    disabled={loading}
                    onPress={() => setShowCustomForm(true)}
                    className="flex-row items-center p-3 rounded-xl border border-dashed border-stone-300 active:bg-stone-50"
                  >
                    <View className="w-10 h-10 rounded-full bg-stone-200 items-center justify-center mr-3">
                      <Ionicons name="person-add-outline" size={18} color="#57534E" />
                    </View>
                    <Text className="text-sm font-semibold text-stone-700">
                      Use another Google account
                    </Text>
                  </Pressable>
                ) : (
                  <View className="p-3 bg-stone-50 border border-stone-200 rounded-xl gap-2 mt-1">
                    <Text className="text-xs font-bold text-stone-700">Enter Account Info</Text>
                    <TextInput
                      placeholder="Your Name (e.g. Hero)"
                      value={customName}
                      onChangeText={setCustomName}
                      className="bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800"
                    />
                    <TextInput
                      placeholder="Google Email (e.g. name@gmail.com)"
                      value={customEmail}
                      onChangeText={setCustomEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-800"
                    />
                    <Pressable
                      disabled={loading || !customEmail.includes("@")}
                      onPress={handleCustomSubmit}
                      style={{ backgroundColor: THEME_CONFIG.COLORS.BRAND }}
                      className={`h-10 rounded-lg items-center justify-center mt-1 ${
                        !customEmail.includes("@") ? "opacity-50" : ""
                      }`}
                    >
                      <Text className="text-white font-bold text-sm">Sign In with This Account</Text>
                    </Pressable>
                  </View>
                )}

                <Text className="text-[11px] text-stone-400 text-center mt-2 leading-4">
                  To continue, Google will share your name, email address, and language preference with Traki.
                </Text>
              </View>
            ) : (
              /* Apple SSO Account Chooser */
              <View className="gap-3">
                <Text className="text-xs text-stone-500 font-medium mb-1">
                  Create an account for <Text className="font-bold text-stone-800">Traki</Text> using your Apple ID.
                </Text>

                {/* Apple ID Card */}
                <View className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-black items-center justify-center mr-3">
                    <Ionicons name="logo-apple" size={20} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-stone-900">
                      {AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.displayName}
                    </Text>
                    <Text className="text-xs text-stone-500">Apple ID Account</Text>
                  </View>
                </View>

                {/* Email Relay Radio options */}
                <View className="border border-stone-200 rounded-xl overflow-hidden mt-1">
                  <Pressable
                    disabled={loading}
                    onPress={() => setAppleEmailChoice("share")}
                    className={`p-3 flex-row items-center justify-between border-b border-stone-100 ${
                      appleEmailChoice === "share" ? "bg-stone-50" : "bg-white"
                    }`}
                  >
                    <View>
                      <Text className="text-sm font-semibold text-stone-800">Share My Email</Text>
                      <Text className="text-xs text-stone-500">
                        {AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.sharedEmail}
                      </Text>
                    </View>
                    <Ionicons
                      name={appleEmailChoice === "share" ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={appleEmailChoice === "share" ? "#000000" : "#D6D3D1"}
                    />
                  </Pressable>

                  <Pressable
                    disabled={loading}
                    onPress={() => setAppleEmailChoice("hide")}
                    className={`p-3 flex-row items-center justify-between ${
                      appleEmailChoice === "hide" ? "bg-stone-50" : "bg-white"
                    }`}
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-sm font-semibold text-stone-800">Hide My Email</Text>
                      <Text className="text-xs text-stone-500">
                        {AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.relayEmail}
                      </Text>
                      <Text className="text-[10px] text-stone-400 mt-0.5">
                        Forwards to your personal email address.
                      </Text>
                    </View>
                    <Ionicons
                      name={appleEmailChoice === "hide" ? "checkmark-circle" : "ellipse-outline"}
                      size={20}
                      color={appleEmailChoice === "hide" ? "#000000" : "#D6D3D1"}
                    />
                  </Pressable>
                </View>

                {/* Apple Action Button */}
                <Pressable
                  disabled={loading}
                  onPress={() =>
                    handleAccountClick({
                      email:
                        appleEmailChoice === "share"
                          ? AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.sharedEmail
                          : AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.relayEmail,
                      displayName: AUTH_CONFIG.DEMO_ACCOUNTS.APPLE.displayName,
                      provider: "apple",
                    })
                  }
                  className="h-11 bg-black rounded-xl flex-row items-center justify-center gap-2 mt-2 active:opacity-90"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="logo-apple" size={18} color="white" />
                      <Text className="text-white font-bold text-sm">
                        Continue with Apple ID
                      </Text>
                    </>
                  )}
                </Pressable>

                <Text className="text-[11px] text-stone-400 text-center mt-1">
                  Protected by Apple Privacy & Secure Enclave.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Cancel Button */}
          <Pressable
            disabled={loading}
            onPress={onClose}
            className="mt-4 pt-3 border-t border-stone-100 items-center"
          >
            <Text className="text-xs font-semibold text-stone-500">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
