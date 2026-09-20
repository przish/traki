import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  Pressable,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import TextField from "../../components/text-field";
import Continue from "../../components/continue";
import Logo from "../../components/logo";
import ORdivider from "../../components/ORdivider";
import LoginMethods from "../../components/LoginMethods";
import { useAuth } from "@/src/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function SignUp() {
  const router = useRouter();
  const { error: contextError, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const activeError = localError || contextError;

  const handleContinue = () => {
    setLocalError(null);
    clearError();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push("/passCreate");
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
          <Text className="text-[#AF2219] text-2xl font-black tracking-tight text-center">
            Let&apos;s start with your email
          </Text>
          <Text className="text-stone-500 text-xs text-center font-medium mt-0.5">
            Your journey to financial mastery starts here
          </Text>
        </View>

        {activeError ? (
          <View className="w-full bg-red-50 border border-red-200 rounded-xl p-3 my-2 flex-row items-center justify-between">
            <Text className="text-red-700 text-xs font-semibold flex-1 mr-2">
              {activeError}
            </Text>
            <Pressable
              onPress={() => {
                setLocalError(null);
                clearError();
              }}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color="#AF2219" />
            </Pressable>
          </View>
        ) : null}

        <View className="w-full gap-3 mt-2">
          <View className="gap-1.5">
            <Text className="text-stone-700 text-xs font-bold uppercase tracking-wider">
              Email Address
            </Text>
            <TextField
              placeholder="e.g. hero@traki.app"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Continue
            title="Continue to Passcode"
            onPress={handleContinue}
          />

          <ORdivider />

          <LoginMethods
            onSuccess={() => router.replace("/(tabs)")}
            onError={(err) => setLocalError(err)}
          />
        </View>

        <View className="mt-8">
          <Pressable
            onPress={() => {
              router.push("/login");
            }}
          >
            {({ pressed }) => (
              <Text
                className={`text-[#AF2219] text-sm font-semibold ${
                  pressed ? "underline opacity-80" : ""
                }`}
              >
                Already have an account? <Text className="font-bold underline">Log In</Text>
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
