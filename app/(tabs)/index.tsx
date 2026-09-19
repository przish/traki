import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Pressable,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { useColors } from "@/hooks/use-colors";
import { formatCents } from "@/src/services/economyService";

export default function CombatScreen() {
  const { profile, bosses, logTransaction, wallets, categories } = useTraki();
  const colors = useColors();
  const [floatingDamage, setFloatingDamage] = useState<{ id: number; text: string; isCrit: boolean } | null>(null);
  const [partnerPoked, setPartnerPoked] = useState(false);

  const dailyBoss = bosses.find((b) => b.tier === "daily") || {
    name: "Imp of Impulsive Buys",
    title: "Daily Mob",
    current_hp: 250,
    max_hp: 500,
    gold_reward: 120,
    exp_reward: 50,
  };

  const weeklyBoss = bosses.find((b) => b.tier === "weekly") || {
    name: "The Interest Behemoth",
    title: "Weekly Miniboss",
    current_hp: 1350,
    max_hp: 2000,
  };

  const monthlyBoss = bosses.find((b) => b.tier === "monthly") || {
    name: "Titan of Inflation",
    title: "Monthly Titan",
    current_hp: 6100,
    max_hp: 8000,
  };

  const handleQuickStrike = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    const walletId = wallets[0]?.id ?? "w_cash";
    const catId = categories[0]?.id ?? "c_food";

    const res = await logTransaction(50, catId, walletId, "Quick Habit Strike");
    const dmgText = res.isCrit ? `CRIT! -${res.totalDamage}` : `-${res.totalDamage} DMG`;
    setFloatingDamage({ id: Date.now(), text: dmgText, isCrit: res.isCrit });
    setTimeout(() => setFloatingDamage(null), 1400);
  };

  const handlePokePartner = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setPartnerPoked(true);
    setTimeout(() => setPartnerPoked(false), 3000);
  };

  const isDailyDefeated = dailyBoss.current_hp <= 0;
  const dailyHpPercent = Math.max(0, Math.min(100, Math.round((dailyBoss.current_hp / dailyBoss.max_hp) * 100)));
  const weeklyHpPercent = Math.max(0, Math.min(100, Math.round((weeklyBoss.current_hp / weeklyBoss.max_hp) * 100)));
  const monthlyHpPercent = Math.max(0, Math.min(100, Math.round((monthlyBoss.current_hp / monthlyBoss.max_hp) * 100)));

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Top Header & Currencies HUD */}
        <View className="flex-row items-center justify-between py-3 mb-2">
          <View className="flex-row items-center gap-2.5">
            <View className="h-10 w-10 rounded-2xl bg-primary items-center justify-center shadow-sm">
              <MaterialIcons name="local-fire-department" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
                Duo Habit Streak
              </Text>
              <Text className="text-base font-black text-foreground">
                {profile?.current_streak ?? 1} Days Active
              </Text>
            </View>
          </View>

          {/* Currencies Pill Bag */}
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1 bg-[#FFF1D7] dark:bg-[#382B14] px-2.5 py-1.5 rounded-full border border-[#F1B64A]/40">
              <MaterialIcons name="monetization-on" size={15} color="#F1B64A" />
              <Text className="text-xs font-black text-[#A87610] dark:text-[#F6CA78]">
                {profile?.gold ?? 0}
              </Text>
            </View>

            <View className="flex-row items-center gap-1 bg-[#E8E4F2] dark:bg-[#322B45] px-2.5 py-1.5 rounded-full border border-[#9D8CD7]/40">
              <MaterialIcons name="stars" size={15} color="#7C69C4" />
              <Text className="text-xs font-black text-[#5B48A2] dark:text-[#C5BBEA]">
                {profile?.trk_tokens ?? 0}
              </Text>
            </View>

            <View className="flex-row items-center gap-1 bg-surface border border-border px-2.5 py-1.5 rounded-full shadow-2xs">
              <MaterialIcons name="shield" size={15} color={colors.primary} />
              <Text className="text-xs font-black text-foreground">
                {profile?.streak_shields ?? 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Stage: Daily Mob Card */}
        <View className="bg-surface rounded-3xl p-5 border border-border mb-4 shadow-sm relative overflow-hidden">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 pr-2">
              <View className="flex-row items-center gap-2 mb-1.5">
                <View className="bg-primary/10 px-2.5 py-0.5 rounded-md">
                  <Text className="text-[10px] font-black uppercase tracking-wider text-primary">
                    {dailyBoss.title}
                  </Text>
                </View>
                <Text className="text-xs text-muted font-medium">Resets midnight</Text>
              </View>
              <Text className="text-xl font-black text-foreground tracking-tight">
                {dailyBoss.name}
              </Text>
            </View>
            <View className="h-12 w-12 rounded-2xl bg-canvas items-center justify-center border border-border">
              <MaterialIcons
                name={isDailyDefeated ? "emoji-events" : "pest-control"}
                size={26}
                color={isDailyDefeated ? "#F1B64A" : colors.primary}
              />
            </View>
          </View>

          {/* Floating Damage VFX */}
          {floatingDamage && (
            <View
              style={[
                styles.floatingTag,
                floatingDamage.isCrit ? styles.floatingCritTag : styles.floatingNormalTag,
              ]}
            >
              <Text style={styles.floatingText}>{floatingDamage.text}</Text>
            </View>
          )}

          {/* Boss HP Bar */}
          <View className="mt-3 mb-2">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-xs font-bold text-muted">Mob Health Points</Text>
              <Text className="text-xs font-black tabular-nums text-foreground">
                {isDailyDefeated ? "DEFEATED!" : `${dailyBoss.current_hp} / ${dailyBoss.max_hp} HP (${dailyHpPercent}%)`}
              </Text>
            </View>
            <View className="h-3.5 w-full bg-border rounded-full overflow-hidden">
              <View
                style={{
                  width: `${isDailyDefeated ? 0 : dailyHpPercent}%`,
                  backgroundColor: dailyHpPercent > 25 ? colors.primary : "#E53E3E",
                  height: "100%",
                }}
              />
            </View>
          </View>

          {/* Bounty on Defeat */}
          <View className="flex-row items-center justify-between pt-2.5 border-t border-border mt-3">
            <Text className="text-xs font-semibold text-muted">Loot on Defeat:</Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-xs font-black text-[#A87610] dark:text-[#F6CA78]">
                +{dailyBoss.gold_reward} Gold
              </Text>
              <Text className="text-xs font-black text-primary">
                +50 EXP
              </Text>
            </View>
          </View>
        </View>

        {/* Rapid Strike CTAs */}
        <View className="flex-row gap-2.5 mb-5">
          <Pressable
            onPress={() => router.push("/quick-log")}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <MaterialIcons name="flash-on" size={20} color="#FFFFFF" />
            <Text className="text-white font-black text-sm tracking-wide">
              3-SEC QUICK LOG
            </Text>
          </Pressable>

          <Pressable
            onPress={handleQuickStrike}
            style={({ pressed }) => [
              styles.quickStrikeBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
            ]}
          >
            <MaterialIcons name="sports-martial-arts" size={18} color={colors.foreground} />
            <Text className="font-bold text-xs text-foreground">Habit Strike</Text>
          </Pressable>
        </View>

        {/* Cleave Radar: Weekly & Monthly Bosses */}
        <View className="flex-row items-center justify-between mb-2.5">
          <Text className="text-xs font-extrabold uppercase tracking-wider text-muted">
            Cleave Radar (35% & 15%)
          </Text>
          <Text className="text-[11px] font-semibold text-primary">Concurrent</Text>
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-border mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2.5">
              <View className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950 items-center justify-center">
                <MaterialIcons name="security" size={18} color="#2B6CB0" />
              </View>
              <View>
                <Text className="text-sm font-bold text-foreground">{weeklyBoss.name}</Text>
                <Text className="text-[10px] text-muted">Takes 35% damage from all strikes</Text>
              </View>
            </View>
            <Text className="text-xs font-black tabular-nums text-foreground">
              {weeklyHpPercent}%
            </Text>
          </View>
          <View className="h-2 w-full bg-border rounded-full overflow-hidden">
            <View style={{ width: `${weeklyHpPercent}%`, backgroundColor: "#2B6CB0", height: "100%" }} />
          </View>
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-border mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2.5">
              <View className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950 items-center justify-center">
                <MaterialIcons name="whatshot" size={18} color="#805AD5" />
              </View>
              <View>
                <Text className="text-sm font-bold text-foreground">{monthlyBoss.name}</Text>
                <Text className="text-[10px] text-muted">Cleaves 15% (Drops Rare TRK Tokens)</Text>
              </View>
            </View>
            <Text className="text-xs font-black tabular-nums text-foreground">
              {monthlyHpPercent}%
            </Text>
          </View>
          <View className="h-2 w-full bg-border rounded-full overflow-hidden">
            <View style={{ width: `${monthlyHpPercent}%`, backgroundColor: "#805AD5", height: "100%" }} />
          </View>
        </View>

        {/* Co-op Duo Partner Section */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 rounded-2xl bg-canvas border border-border items-center justify-center">
                <Text className="text-sm font-black text-foreground">KP</Text>
              </View>
              <View>
                <Text className="text-sm font-black text-foreground">
                  Partner: {profile?.partner_name ?? "Kira"}
                </Text>
                <Text className="text-xs text-muted">
                  Daily mission board: 2/3 complete
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handlePokePartner}
              className="px-3 py-1.5 rounded-xl bg-canvas border border-border"
            >
              <Text className="text-xs font-bold text-foreground">
                {partnerPoked ? "Poked! ⚡️" : "Poke Partner"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Duo Habit Pact Info Card */}
        <View className="bg-canvas rounded-2xl p-4 border border-border">
          <Text className="text-xs font-black uppercase tracking-wider text-foreground mb-1">
            How Combat Scales
          </Text>
          <Text className="text-xs text-muted leading-relaxed">
            Every transaction logged strikes the daily mob with 100 base damage scaled by your streak multiplier (up to 2.0x). First 5 logs each day deal full damage!
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    flex: 2,
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#D92C3B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  quickStrikeBtn: {
    flex: 1.2,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  floatingTag: {
    position: "absolute",
    top: 40,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingNormalTag: {
    backgroundColor: "#D92C3B",
  },
  floatingCritTag: {
    backgroundColor: "#F1B64A",
  },
  floatingText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 14,
  },
});
