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
import TextField from "../../components/text-field";
import Continue from "../../components/continue";
import BackButton from "../../components/back-button";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = () => {
    if (!email) return;
    setIsLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 500);
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
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[420px] self-center">
            <BackButton />

        <View className="my-6">
          <Text className="text-[32px] font-black text-[#AF2219] leading-tight">
            Let&apos;s reset your password
          </Text>
          <Text className="text-stone-600 text-sm mt-3 leading-relaxed">
            Enter the email address associated with your Traki account, and we&apos;ll
            send you a link to reset your hero passcode.
          </Text>
        </View>

        {isSent ? (
          <View className="bg-[#AF221915] border border-[#A13024]/30 rounded-2xl p-5 gap-3 mt-4">
            <Text className="text-base font-black text-[#AF2219]">
              Check Your Inbox!
            </Text>
            <Text className="text-xs text-stone-700 leading-relaxed">
              We&apos;ve dispatched a recovery pigeon to <Text className="font-bold">{email}</Text>. Follow the link in the message to restore your passcode.
            </Text>
            <Pressable
              onPress={() => router.replace("/login")}
              className="mt-2 h-[40px] items-center justify-center rounded-xl bg-[#AF2219]"
            >
              <Text className="text-white font-bold text-sm">
                Return to Login
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full gap-4 mt-2">
            <View className="gap-1.5">
              <Text className="text-stone-700 text-xs font-bold uppercase tracking-wider">
                Email Address
              </Text>
              <TextField
                placeholder="hero@traki.app"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Continue
              title="Send Reset Link"
              loading={isLoading}
              onPress={handleSend}
            />

            <View className="items-center mt-4">
              <Pressable onPress={() => router.replace("/login")}>
                <Text className="text-xs font-bold text-[#AF2219]">
                  Remember your password? Log in
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}