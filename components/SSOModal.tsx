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
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { THEME_CONFIG, isValidEmail, isValidNonEmptyText } from "@/src/constants";

export interface SelectedSSOAccount {
  id?: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: "google" | "apple" | "email";
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

  const isCustomValid = isValidEmail(customEmail) && isValidNonEmptyText(customName);

  const handleCustomSubmit = async () => {
    if (!isCustomValid || loading) return;
    const email = customEmail.trim();
    const name = customName.trim();
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
      <View style={StyleSheet.absoluteFill} className="justify-end sm:justify-center items-center p-0 sm:p-4">
        {/* Backdrop overlay */}
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)" }]}
          onPress={onClose}
        />

        {/* Modal Card */}
        <View
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-stone-200 overflow-hidden"
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
              className="p-1 rounded-full active:bg-stone-200"
            >
              <Ionicons name="close" size={20} color="#78716C" />
            </Pressable>
          </View>

          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <View className="gap-3">
              <Text className="text-xs text-stone-500 font-medium mb-1">
                Enter your {isGoogle ? "Google" : "Apple"} credentials to continue to{" "}
                <Text className="font-bold text-stone-800">Traki</Text>
              </Text>

              <View className="p-4 bg-stone-50 border border-stone-200 rounded-2xl gap-3">
                <View className="gap-1">
                  <Text className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    Full Name
                  </Text>
                  <TextInput
                    placeholder="e.g. Hunter"
                    value={customName}
                    onChangeText={setCustomName}
                    className="bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-800"
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                    {isGoogle ? "Google Email" : "Apple ID Email"}
                  </Text>
                  <TextInput
                    placeholder={isGoogle ? "e.g. user@gmail.com" : "e.g. user@icloud.com"}
                    value={customEmail}
                    onChangeText={setCustomEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm text-stone-800"
                  />
                </View>

                <Pressable
                  disabled={loading || !isCustomValid}
                  onPress={handleCustomSubmit}
                  style={{ backgroundColor: isGoogle ? THEME_CONFIG.COLORS.BRAND : "#000000" }}
                  className={`h-11 rounded-xl items-center justify-center mt-1 ${
                    !isCustomValid || loading ? "opacity-50" : "active:opacity-90"
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold text-sm">
                      {isGoogle ? "Authorize with Google" : "Continue with Apple ID"}
                    </Text>
                  )}
                </Pressable>
              </View>

              <Text className="text-[11px] text-stone-400 text-center mt-1 leading-4">
                Securely authenticated with Traki vault encryption.
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Cancel Button */}
          <Pressable
            disabled={loading}
            onPress={onClose}
            className="mt-4 pt-3 border-t border-stone-100 items-center"
          >
            <Text className="text-xs font-semibold text-stone-500">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
