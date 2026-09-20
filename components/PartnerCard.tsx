import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Share,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { useTraki } from "@/src/context/TrakiContext";
import { PartnerService } from "@/src/services/partnerService";
import { isValidPartnerCode } from "@/src/constants";

export interface PartnerCardProps {
  showUnlinkOption?: boolean;
  onPartnerLinked?: (partnerName: string) => void;
  className?: string;
}

export default function PartnerCard({
  showUnlinkOption = true,
  onPartnerLinked,
  className = "",
}: PartnerCardProps) {
  const { profile, refreshData } = useTraki();

  // Mode: "invite" or "join"
  const [activeTab, setActiveTab] = useState<"invite" | "join">("invite");

  // Invite state
  const [partnerCode, setPartnerCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Join state
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Poke state
  const [poked, setPoked] = useState(false);

  // Hidden text input ref for digit boxes
  const inputRef = useRef<TextInput>(null);

  // Countdown timer for generated code
  useEffect(() => {
    if (!codeExpiresAt) return;
    const interval = setInterval(() => {
      const remainingMs = new Date(codeExpiresAt).getTime() - Date.now();
      if (remainingMs <= 0) {
        setTimeRemaining("Expired");
        setPartnerCode(null);
        setCodeExpiresAt(null);
        clearInterval(interval);
      } else {
        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.floor((remainingMs % 60000) / 1000);
        setTimeRemaining(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setFeedbackMsg(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const result = await PartnerService.generatePartnerCode();
    if (result) {
      setPartnerCode(result.code);
      setCodeExpiresAt(result.expiresAt);
    } else {
      setFeedbackMsg({
        type: "error",
        text: "Failed to generate invite code. Try again.",
      });
    }
    setIsGenerating(false);
  };

  const handleShareInvite = async () => {
    if (!partnerCode) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    try {
      await Share.share({
        message: `Join my Traki quest! My 4-digit partner code is: ${partnerCode}. Enter it to unlock Duo Streaks and battle bosses together!`,
      });
    } catch {
      // Fallback copy if Share dialog is dismissed or unsupported
      handleCopyCode();
    }
  };

  const handleCopyCode = async () => {
    if (!partnerCode) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(partnerCode);
      } catch {}
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isJoinCodeValid = isValidPartnerCode(joinCode);

  const handleJoinPartner = async () => {
    if (!isJoinCodeValid || isJoining) return;
    setIsJoining(true);
    setFeedbackMsg(null);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const result = await PartnerService.redeemPartnerCode(joinCode.trim());
    if (result.success) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setFeedbackMsg({
        type: "success",
        text: `Successfully linked with ${result.partnerName || "Partner"}! 🎉`,
      });
      setJoinCode("");
      await refreshData();
      onPartnerLinked?.(result.partnerName || "Partner");
    } else {
      setFeedbackMsg({
        type: "error",
        text: result.error || "Failed to link partner.",
      });
    }
    setIsJoining(false);
  };

  const handlePoke = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setPoked(true);
    setTimeout(() => setPoked(false), 2500);
  };

  const handleUnlink = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    await PartnerService.unlinkPartner();
    await refreshData();
    setFeedbackMsg({ type: "success", text: "Partner unlinked." });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // ==========================================
  // 1. BOUND PARTNER STATE (Already Linked)
  // ==========================================
  if (profile?.partner_name) {
    return (
      <View
        className={`bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs ${className}`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 rounded-full bg-[#AF221915] border border-[#AF221930] items-center justify-center">
              <MaterialIcons name="favorite" size={22} color="#AF2219" />
            </View>
            <View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm font-black text-stone-900">
                  {profile.partner_name}
                </Text>
                <View className="bg-[#C9E7D2] px-1.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-black text-[#1C5E2D]">
                    Active Duo
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-stone-500 font-medium mt-0.5">
                {profile.partner_streak ?? 0}-Day Shared Streak Sync
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handlePoke}
            className={`px-3 py-1.5 rounded-xl border ${
              poked
                ? "bg-[#AF2219] border-[#AF2219]"
                : "bg-[#AF221915] border-[#AF221940] active:bg-[#AF221925]"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                poked ? "text-white" : "text-[#AF2219]"
              }`}
            >
              {poked ? "Poked! ❤️" : "Poke Partner"}
            </Text>
          </Pressable>
        </View>

        {showUnlinkOption && (
          <Pressable
            onPress={handleUnlink}
            className="mt-3 pt-2.5 border-t border-stone-100 items-center"
          >
            <Text className="text-[11px] font-semibold text-stone-400">
              Unlink Partner
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  // ==========================================
  // 2. UNBOUND PARTNER STATE (Invite or Join)
  // ==========================================
  return (
    <View
      className={`bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs ${className}`}
    >
      {/* Header Banner */}
      <View className="flex-row items-center gap-2.5 mb-3">
        <View className="h-8 w-8 rounded-xl bg-[#AF221915] border border-[#AF221930] items-center justify-center">
          <MaterialIcons name="favorite-border" size={18} color="#AF2219" />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-black uppercase tracking-wider text-stone-900">
            Duo Partnership Quest
          </Text>
          <Text className="text-[11px] text-stone-500 font-medium">
            Sync habits and double your battle damage together
          </Text>
        </View>
      </View>

      {/* Segmented Mode Selector: Invite vs Join */}
      <View className="flex-row bg-[#FAF8F6] p-1 rounded-xl border border-stone-200 mb-3">
        <Pressable
          onPress={() => {
            setActiveTab("invite");
            setFeedbackMsg(null);
          }}
          className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
            activeTab === "invite" ? "bg-white shadow-2xs" : ""
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === "invite" ? "text-[#AF2219]" : "text-stone-500"
            }`}
          >
            Invite Partner
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setActiveTab("join");
            setFeedbackMsg(null);
          }}
          className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
            activeTab === "join" ? "bg-white shadow-2xs" : ""
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === "join" ? "text-[#AF2219]" : "text-stone-500"
            }`}
          >
            Join Partnership
          </Text>
        </Pressable>
      </View>

      {/* Feedback Alert Toast */}
      {feedbackMsg && (
        <View
          className={`p-2.5 rounded-xl mb-3 border ${
            feedbackMsg.type === "success"
              ? "bg-[#C9E7D2] border-[#3C9B55]/40"
              : "bg-[#AF221915] border-[#AF221940]"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              feedbackMsg.type === "success" ? "text-[#1C5E2D]" : "text-[#AF2219]"
            }`}
          >
            {feedbackMsg.text}
          </Text>
        </View>
      )}

      {/* TAB 1: INVITE PARTNER (Generate Unique 4-Digit Code) */}
      {activeTab === "invite" && (
        <View className="items-center">
          {partnerCode ? (
            <View className="w-full items-center">
              <Text className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                Your 4-Digit Partner Code
              </Text>

              {/* 4-Digit Hero Boxes */}
              <View className="flex-row gap-2.5 my-2">
                {partnerCode.split("").map((digit, idx) => (
                  <View
                    key={idx}
                    className="w-12 h-14 rounded-2xl bg-[#AF22190A] border-2 border-[#AF221940] items-center justify-center shadow-2xs"
                  >
                    <Text className="text-2xl font-black text-[#AF2219] tabular-nums">
                      {digit}
                    </Text>
                  </View>
                ))}
              </View>

              <Text className="text-[11px] text-stone-500 font-medium mb-3">
                Expires in {timeRemaining || "15:00"}
              </Text>

              {/* Action Buttons: Invite & Copy */}
              <View className="flex-row gap-2 w-full mb-2">
                <Pressable
                  onPress={handleShareInvite}
                  className="flex-1 h-[42px] rounded-xl bg-[#AF2219] flex-row items-center justify-center gap-1.5 active:bg-[#8F1E2C] shadow-xs"
                >
                  <MaterialIcons name="share" size={16} color="white" />
                  <Text className="text-white font-bold text-xs">
                    Invite Partner
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleCopyCode}
                  className="px-4 h-[42px] rounded-xl border border-stone-200 bg-[#FAF8F6] flex-row items-center justify-center gap-1 active:bg-stone-100"
                >
                  <MaterialIcons
                    name={copied ? "check" : "content-copy"}
                    size={16}
                    color={copied ? "#3C9B55" : "#57534E"}
                  />
                  <Text
                    className={`font-bold text-xs ${
                      copied ? "text-[#3C9B55]" : "text-stone-700"
                    }`}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Text>
                </Pressable>
              </View>

              <Pressable onPress={handleGenerateCode} disabled={isGenerating}>
                <Text className="text-[11px] font-semibold text-stone-400 mt-1">
                  Generate new code
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="w-full py-1">
              <Text className="text-xs text-stone-600 text-center leading-relaxed mb-3">
                Generate a unique 4-digit code to invite your partner. They will
                enter it on their phone to activate Duo Streaks.
              </Text>

              <Pressable
                onPress={handleGenerateCode}
                disabled={isGenerating}
                className="h-[44px] w-full rounded-xl bg-[#AF2219] items-center justify-center active:bg-[#8F1E2C] shadow-xs"
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View className="flex-row items-center gap-1.5">
                    <MaterialIcons name="key" size={16} color="white" />
                    <Text className="text-white font-bold text-sm">
                      Generate 4-Digit Code
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* TAB 2: JOIN PARTNERSHIP (Enter Unique 4-Digit Code) */}
      {activeTab === "join" && (
        <View className="w-full">
          <Text className="text-xs text-stone-600 text-center mb-3">
            Ask your partner for their 4-digit code and enter it below:
          </Text>

          {/* Interactive 4-Digit Segmented Input Boxes */}
          <Pressable
            onPress={() => inputRef.current?.focus()}
            className="flex-row justify-center gap-3 my-1"
          >
            {[0, 1, 2, 3].map((index) => {
              const char = joinCode[index] || "";
              const isFocused = joinCode.length === index;
              return (
                <View
                  key={index}
                  className={`w-13 h-14 rounded-2xl items-center justify-center border-2 ${
                    char
                      ? "border-[#AF2219] bg-[#AF22190A]"
                      : isFocused
                      ? "border-stone-800 bg-white"
                      : "border-stone-200 bg-[#FAF8F6]"
                  }`}
                >
                  <Text className="text-2xl font-black text-stone-900 tabular-nums">
                    {char}
                  </Text>
                </View>
              );
            })}
          </Pressable>

          {/* Invisible TextInput that captures numeric keyboard input */}
          <TextInput
            ref={inputRef}
            value={joinCode}
            onChangeText={(text) => {
              const numericOnly = text.replace(/[^0-9]/g, "").slice(0, 4);
              setJoinCode(numericOnly);
            }}
            keyboardType="number-pad"
            maxLength={4}
            autoFocus={false}
            style={{
              position: "absolute",
              opacity: 0,
              width: 1,
              height: 1,
              top: 0,
            }}
          />

          {/* Join CTA Button */}
          <Pressable
            onPress={handleJoinPartner}
            disabled={!isJoinCodeValid || isJoining}
            className={`h-[44px] w-full rounded-xl items-center justify-center mt-3 shadow-xs ${
              isJoinCodeValid && !isJoining
                ? "bg-[#AF2219] active:bg-[#8F1E2C]"
                : "bg-stone-200 opacity-60"
            }`}
          >
            {isJoining ? (
              <ActivityIndicator size="small" color="#AF2219" />
            ) : (
              <View className="flex-row items-center gap-1.5">
                <MaterialIcons
                  name="link"
                  size={18}
                  color={isJoinCodeValid ? "#FFFFFF" : "#8B8988"}
                />
                <Text
                  className={`font-bold text-sm ${
                    isJoinCodeValid ? "text-white" : "text-stone-400"
                  }`}
                >
                  Join Partnership
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
