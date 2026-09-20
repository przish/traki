import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable, Switch, Image, TextInput } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { useThemeContext } from "@/lib/theme-provider";
import { useAuth } from "@/src/context/AuthContext";
import { PartnerService } from "@/src/services/partnerService";

export default function ProfileScreen() {
  const { profile, syncState, syncNow } = useTraki();
  const { user, signOut } = useAuth();
  const { colorScheme, setColorScheme } = useThemeContext();
  const [showMechanics, setShowMechanics] = useState(false);
  const [showShortcutGuide, setShowShortcutGuide] = useState(false);

  // Partner pairing state
  const [showPartnerSection, setShowPartnerSection] = useState(false);
  const [partnerCode, setPartnerCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [partnerMsg, setPartnerMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  const expToNextLevel = (profile?.level ?? 1) * 200;
  const expProgressPercent = Math.min(
    100,
    Math.round(((profile?.exp ?? 0) / expToNextLevel) * 100)
  );

  const handleLogout = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch { }
    await signOut();
    router.replace("/login");
  };

  const displayName = user?.displayName || (profile?.partner_name ? "Hunter" : "Player One");
  const userInitials = user?.displayName
    ? user.displayName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    : "TK";

  const getProviderLabel = () => {
    if (!user) return "Local Quest Profile";
    switch (user.provider) {
      case "google":
        return "Google SSO";
      case "apple":
        return "Apple SSO";
      case "stingray":
        return "Stingray SSO";
      default:
        return "Authenticated";
    }
  };

  // Code expiry countdown
  useEffect(() => {
    if (!codeExpiresAt) return;
    const interval = setInterval(() => {
      const diff = new Date(codeExpiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setPartnerCode(null);
        setCodeExpiresAt(null);
        setTimeRemaining("");
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
    const result = await PartnerService.generatePartnerCode();
    if (result) {
      setPartnerCode(result.code);
      setCodeExpiresAt(result.expiresAt);
      setPartnerMsg(null);
    } else {
      setPartnerMsg({ type: "error", text: "Failed to generate code. Try again." });
    }
    setIsGenerating(false);
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim() || redeemCode.trim().length < 6) {
      setPartnerMsg({ type: "error", text: "Enter a valid 6-character code." });
      return;
    }
    setIsRedeeming(true);
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch { }
    const result = await PartnerService.redeemPartnerCode(redeemCode.trim());
    if (result.success) {
      setPartnerMsg({ type: "success", text: `Linked with ${result.partnerName}! 🎉` });
      setRedeemCode("");
    } else {
      setPartnerMsg({ type: "error", text: result.error || "Failed to redeem code." });
    }
    setIsRedeeming(false);
  };

  const handleUnlinkPartner = async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch { }
    await PartnerService.unlinkPartner();
    setPartnerMsg({ type: "success", text: "Partner unlinked." });
    setTimeout(() => setPartnerMsg(null), 3000);
  };

  const getSyncLabel = () => {
    switch (syncState.status) {
      case "synced": return "Cloud Synced";
      case "syncing": return "Syncing...";
      case "offline": return "Offline Mode";
      case "error": return "Sync Error";
      default: return "Idle";
    }
  };

  const getSyncColor = () => {
    switch (syncState.status) {
      case "synced": return "#3C9B55";
      case "syncing": return "#F1B64A";
      case "offline": return "#8B8988";
      case "error": return "#D92C3B";
      default: return "#8B8988";
    }
  };

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View className="py-3 mb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] font-black uppercase tracking-widest text-[#AF2219]">
              Player Status
            </Text>
            <Text className="text-2xl font-black text-stone-900">Profile & Duo</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View className="bg-white rounded-3xl p-5 border border-stone-200 mb-5 shadow-2xs">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="h-16 w-16 rounded-2xl bg-[#AF221915] border-2 border-[#AF2219] items-center justify-center shadow-xs">
              <Text className="text-2xl font-black text-[#AF2219]">{userInitials}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-black text-stone-900" numberOfLines={1}>
                  {displayName}
                </Text>
                <View className="bg-[#AF221915] px-2.5 py-0.5 rounded-md border border-[#AF221930]">
                  <Text className="text-[10px] font-black text-[#AF2219]">
                    LVL {profile?.level ?? 1}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-stone-500 font-medium mt-0.5" numberOfLines={1}>
                {user?.email ? user.email : `Co-op Duo Partner: ${profile?.partner_name ?? "None"}`}
              </Text>
              <View className="flex-row items-center gap-1.5 mt-1">
                {user?.provider === "google" && (
                  <Image
                    source={require("../../../assets/images/logos/google.png")}
                    className="w-3.5 h-3.5"
                    resizeMode="contain"
                  />
                )}
                {user?.provider === "apple" && (
                  <Image
                    source={require("../../../assets/images/logos/apple-logo.png")}
                    className="w-3.5 h-3.5"
                    resizeMode="contain"
                  />
                )}
                <Text className="text-[10px] font-bold text-stone-600">
                  {getProviderLabel()}
                </Text>
              </View>
            </View>
          </View>

          {/* Level Progress */}
          <View>
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-xs font-bold text-stone-600">Level Progression</Text>
              <Text className="text-xs font-black text-[#AF2219] tabular-nums">
                {profile?.exp ?? 0} / {expToNextLevel} EXP ({expProgressPercent}%)
              </Text>
            </View>
            <View className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
              <View
                style={{
                  width: `${expProgressPercent}%`,
                  backgroundColor: "#AF2219",
                  height: "100%",
                }}
              />
            </View>
          </View>
        </View>

        {/* Co-op Duo Stats */}
        <Text className="text-xs font-black uppercase tracking-wider text-stone-600 mb-2.5">
          Duo Momentum
        </Text>
        <View className="flex-row gap-3 mb-5">
          <View className="bg-white rounded-2xl p-4 border border-stone-200 flex-1 shadow-2xs">
            <Text className="text-[11px] font-bold text-stone-500">Current Streak</Text>
            <Text className="text-2xl font-black text-stone-900 mt-1">
              {profile?.current_streak ?? 1} Days
            </Text>
          </View>
          <View className="bg-white rounded-2xl p-4 border border-stone-200 flex-1 shadow-2xs">
            <Text className="text-[11px] font-bold text-stone-500">Best Streak</Text>
            <Text className="text-2xl font-black text-[#AF2219] mt-1">
              {profile?.highest_streak ?? 1} Days
            </Text>
          </View>
        </View>

        {/* Partner Pairing Section */}
        <Pressable
          onPress={() => setShowPartnerSection(!showPartnerSection)}
          className="flex-row items-center justify-between mb-2.5"
        >
          <Text className="text-xs font-black uppercase tracking-wider text-stone-600">
            Partner Connection
          </Text>
          <MaterialIcons
            name={showPartnerSection ? "expand-less" : "expand-more"}
            size={18}
            color="#8B8988"
          />
        </Pressable>

        {showPartnerSection && (
          <View className="bg-white rounded-2xl p-4 border border-stone-200 mb-5 shadow-2xs">
            {partnerMsg && (
              <View
                className={`p-3 rounded-xl mb-3 border ${partnerMsg.type === "success"
                  ? "bg-[#C9E7D2] border-[#3C9B55]/40"
                  : "bg-[#AF221915] border-[#AF221940]"
                  }`}
              >
                <Text className={`text-xs font-bold ${partnerMsg.type === "success" ? "text-[#1C5E2D]" : "text-[#AF2219]"}`}>
                  {partnerMsg.text}
                </Text>
              </View>
            )}

            {profile?.partner_name ? (
              <View>
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="h-12 w-12 rounded-xl bg-[#AF221915] border border-[#AF221930] items-center justify-center">
                    <MaterialIcons name="favorite" size={24} color="#AF2219" />
                  </View>
                  <View>
                    <Text className="text-sm font-black text-stone-900">
                      Linked with {profile.partner_name}
                    </Text>
                    <Text className="text-xs text-stone-500 font-medium">
                      {profile.partner_streak ?? 0}-day shared streak
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={handleUnlinkPartner}
                  className="h-[38px] rounded-xl border border-stone-200 items-center justify-center active:bg-stone-50"
                >
                  <Text className="text-xs font-bold text-stone-500">Unlink Partner</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Text className="text-xs font-bold text-stone-700 mb-3">
                  Connect with your partner using a 6-digit code:
                </Text>

                {/* Generate Code */}
                <View className="mb-4">
                  <Text className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                    Share Your Code
                  </Text>
                  {partnerCode ? (
                    <View className="bg-[#AF221908] border border-[#AF221920] rounded-xl p-4 items-center">
                      <Text className="text-3xl font-black text-[#AF2219] tracking-[8px] mb-1">
                        {partnerCode}
                      </Text>
                      <Text className="text-[11px] text-stone-500 font-medium">
                        Expires in {timeRemaining || "..."}
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={handleGenerateCode}
                      disabled={isGenerating}
                      className="h-[44px] rounded-xl bg-[#AF2219] items-center justify-center active:bg-[#8F1E2C]"
                    >
                      <Text className="text-white font-bold text-sm">
                        {isGenerating ? "Generating..." : "Generate Partner Code"}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Redeem Code */}
                <View>
                  <Text className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                    Enter Partner&apos;s Code
                  </Text>
                  <View className="flex-row gap-2">
                    <TextInput
                      value={redeemCode}
                      onChangeText={(t) => setRedeemCode(t.toUpperCase())}
                      placeholder="ABC123"
                      placeholderTextColor="#8B8988"
                      maxLength={6}
                      autoCapitalize="characters"
                      className="flex-1 h-[44px] px-3 rounded-xl border border-stone-200 bg-[#FAF8F6] text-center text-lg font-black text-stone-900 tracking-[4px]"
                    />
                    <Pressable
                      onPress={handleRedeemCode}
                      disabled={isRedeeming || redeemCode.length < 6}
                      className={`h-[44px] px-4 rounded-xl items-center justify-center ${redeemCode.length >= 6
                        ? "bg-[#AF2219] active:bg-[#8F1E2C]"
                        : "bg-stone-200"
                        }`}
                    >
                      <Text className={`text-sm font-bold ${redeemCode.length >= 6 ? "text-white" : "text-stone-400"}`}>
                        {isRedeeming ? "..." : "Link"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Cloud Sync Status */}
        <View className="bg-white rounded-2xl p-4 border border-stone-200 mb-5 shadow-2xs">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <View
                style={{ backgroundColor: getSyncColor() }}
                className="w-2.5 h-2.5 rounded-full"
              />
              <View>
                <Text className="text-xs font-bold text-stone-800">{getSyncLabel()}</Text>
                {syncState.lastSyncedAt && (
                  <Text className="text-[10px] text-stone-400 font-medium">
                    Last: {syncState.lastSyncedAt.toLocaleTimeString()}
                  </Text>
                )}
                {syncState.pendingCount > 0 && (
                  <Text className="text-[10px] text-[#AF2219] font-bold">
                    {syncState.pendingCount} pending
                  </Text>
                )}
              </View>
            </View>
            <Pressable
              onPress={syncNow}
              disabled={syncState.status === "syncing"}
              className="px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200 active:bg-stone-200"
            >
              <Text className="text-xs font-bold text-stone-600">
                {syncState.status === "syncing" ? "Syncing..." : "Sync Now"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Preferences & Integrations */}
        <Text className="text-xs font-black uppercase tracking-wider text-stone-600 mb-2.5">
          Settings & Lore
        </Text>

        <View className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-5 shadow-2xs">
          {/* Theme Toggle */}
          <View className="p-4 flex-row items-center justify-between border-b border-stone-100">
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="dark-mode" size={20} color="#AF2219" />
              <Text className="text-sm font-bold text-stone-800">Dark Theme</Text>
            </View>
            <Switch
              value={colorScheme === "dark"}
              onValueChange={(val) => setColorScheme(val ? "dark" : "light")}
              trackColor={{ false: "#E7E1DE", true: "#AF2219" }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* iOS Back Tap Shortcut Guide */}
          <Pressable
            onPress={() => setShowShortcutGuide(!showShortcutGuide)}
            className="p-4 flex-row items-center justify-between border-b border-stone-100 active:bg-stone-50"
          >
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="touch-app" size={20} color="#AF2219" />
              <Text className="text-sm font-bold text-stone-800">iOS Back Tap Integration</Text>
            </View>
            <MaterialIcons
              name={showShortcutGuide ? "expand-less" : "expand-more"}
              size={20}
              color="#8B8988"
            />
          </Pressable>

          {showShortcutGuide && (
            <View className="p-4 bg-[#AF221908] border-b border-stone-100">
              <Text className="text-xs text-stone-700 leading-relaxed font-medium">
                To trigger 3-second rapid logging anytime from your iPhone:
                {"\n"}1. Open the Apple Shortcuts app and create a new Shortcut.
                {"\n"}2. Add action: &ldquo;Open URL&rdquo; &rarr; <Text className="font-bold text-[#AF2219]">traki://quick-log</Text>
                {"\n"}3. Go to iOS Settings &rarr; Accessibility &rarr; Touch &rarr; Back Tap.
                {"\n"}4. Select Double Tap &rarr; choose your Traki Shortcut.
              </Text>
            </View>
          )}

          {/* Combat Lore Modal Toggle */}
          <Pressable
            onPress={() => setShowMechanics(!showMechanics)}
            className="p-4 flex-row items-center justify-between active:bg-stone-50"
          >
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="auto-stories" size={20} color="#AF2219" />
              <Text className="text-sm font-bold text-stone-800">JRPG Mechanics & Formulas</Text>
            </View>
            <MaterialIcons
              name={showMechanics ? "expand-less" : "expand-more"}
              size={20}
              color="#8B8988"
            />
          </Pressable>

          {showMechanics && (
            <View className="p-4 bg-[#AF221908]">
              <Text className="text-xs text-stone-700 leading-relaxed font-medium">
                • Streak Multipliers: 1-2 days (1.0x) &bull; 3-5 days (1.25x) &bull; 6-9 days (1.5x) &bull; 10-13 days (1.75x) &bull; 14+ days (2.0x).
                {"\n"}• Cleave Distribution: 100% Daily Mob, 35% Weekly Miniboss, 15% Monthly Titan.
                {"\n"}• Streak Shields: Protects streak on missed days.
                {"\n"}• TRK Tokens: Awarded for boss victories to unlock Real-World Savings Goals.
              </Text>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <Pressable
          onPress={handleLogout}
          className="h-[44px] rounded-xl bg-white border border-[#A13024] items-center justify-center active:bg-[#AF221915] mb-6"
        >
          <Text className="text-[#AF2219] font-bold text-sm">
            Log Out & Exit Quest
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
