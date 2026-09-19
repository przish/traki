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
  const { profile, bosses, logTransaction } = useTraki();
  const colors = useColors();
  const [floatingDamage, setFloatingDamage] = useState<{ id: number; text: string } | null>(null);

  const dailyBoss = bosses.find((b) => b.tier === "daily") || {
    name: "Imp of Impulsive Buys",
    title: "Daily Mob",
    current_hp: 250,
    max_hp: 500,
    gold_reward: 120,
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
    const res = await logTransaction(50, "c_food", "w_cash", "Quick Coffee Strike");
    const dmgText = res.isCrit ? `CRIT! -${res.totalDamage}` : `-${res.totalDamage} DMG`;
    setFloatingDamage({ id: Date.now(), text: dmgText });
    setTimeout(() => setFloatingDamage(null), 1200);
  };

  const dailyHpPercent = Math.max(0, Math.min(100, Math.round((dailyBoss.current_hp / dailyBoss.max_hp) * 100)));
  const weeklyHpPercent = Math.max(0, Math.min(100, Math.round((weeklyBoss.current_hp / weeklyBoss.max_hp) * 100)));
  const monthlyHpPercent = Math.max(0, Math.min(100, Math.round((monthlyBoss.current_hp / monthlyBoss.max_hp) * 100)));

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Top HUD */}
        <View className="flex-row items-center justify-between py-3 mb-2">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 rounded-xl bg-primary items-center justify-center">
              <MaterialIcons name="local-fire-department" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-muted">Active Streak</Text>
              <Text className="text-base font-black text-foreground">
                {profile?.current_streak ?? 1} Days (Duo)
              </Text>
            </View>
          </View>

          {/* Currencies HUD */}
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1 bg-[#FFF1D7] dark:bg-[#382B14] px-2.5 py-1 rounded-full border border-[#F1B64A]/30">
              <MaterialIcons name="monetization-on" size={16} color="#F1B64A" />
              <Text className="text-xs font-bold text-[#A87610] dark:text-[#F6CA78]">
                {profile?.gold ?? 0}
              </Text>
            </View>

            <View className="flex-row items-center gap-1 bg-[#E8E4F2] dark:bg-[#322B45] px-2.5 py-1 rounded-full border border-[#9D8CD7]/30">
              <MaterialIcons name="stars" size={16} color="#7C69C4" />
              <Text className="text-xs font-bold text-[#5B48A2] dark:text-[#C5BBEA]">
                {profile?.trk_tokens ?? 0} TRK
              </Text>
            </View>

            <View className="flex-row items-center gap-1 bg-[#E7E1DE] dark:bg-[#303336] px-2.5 py-1 rounded-full">
              <MaterialIcons name="shield" size={15} color={colors.primary} />
              <Text className="text-xs font-bold text-foreground">
                {profile?.streak_shields ?? 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Stage: Daily Mob Card */}
        <View className="bg-surface rounded-3xl p-5 border border-border mb-4 shadow-sm relative overflow-hidden">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-[11px] font-extrabold uppercase tracking-widest text-primary bg-redSoft dark:bg-redDeep/30 px-2 py-0.5 rounded-md">
                  {dailyBoss.title}
                </Text>
                <Text className="text-xs text-muted">Resets in 11h 42m</Text>
              </View>
              <Text className="text-xl font-black text-foreground">{dailyBoss.name}</Text>
            </View>
            <View className="h-12 w-12 rounded-2xl bg-canvas items-center justify-center border border-border">
              <MaterialIcons name="pest-control" size={28} color={colors.primary} />
            </View>
          </View>

          {/* Floating Damage VFX */}
          {floatingDamage && (
            <View style={styles.floatingTag}>
              <Text style={styles.floatingText}>{floatingDamage.text}</Text>
            </View>
          )}

          {/* Boss HP Bar */}
          <View className="mt-4 mb-2">
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-xs font-bold text-muted">Health Points</Text>
              <Text className="text-xs font-bold tabular-nums text-foreground">
                {dailyBoss.current_hp} / {dailyBoss.max_hp} HP ({dailyHpPercent}%)
              </Text>
            </View>
            <View className="h-3 w-full bg-border rounded-full overflow-hidden">
              <View
                style={{
                  width: `${dailyHpPercent}%`,
                  backgroundColor: dailyHpPercent > 25 ? colors.primary : "#E53E3E",
                  height: "100%",
                }}
              />
            </View>
          </View>

          {/* Loot Reward Tag */}
          <View className="flex-row items-center justify-between pt-2 border-t border-border mt-3">
            <Text className="text-xs font-medium text-muted">Bounty on Defeat:</Text>
            <Text className="text-xs font-bold text-[#A87610] dark:text-[#F6CA78]">
              +{dailyBoss.gold_reward} Gold & +50 EXP
            </Text>
          </View>
        </View>

        {/* Rapid Strike & Log CTAs */}
        <View className="flex-row gap-3 mb-5">
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
              pressed && { opacity: 0.7 },
            ]}
          >
            <MaterialIcons name="sports-martial-arts" size={18} color={colors.foreground} />
            <Text className="font-bold text-xs text-foreground">Coffee Strike</Text>
          </Pressable>
        </View>

        {/* Cleave Radar: Weekly & Monthly Bosses */}
        <Text className="text-xs font-extrabold uppercase tracking-wider text-muted mb-3">
          Concurrent Cleave Radar (35% & 15%)
        </Text>

        <View className="bg-surface rounded-2xl p-4 border border-border mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="security" size={18} color="#2B6CB0" />
              <View>
                <Text className="text-sm font-bold text-foreground">{weeklyBoss.name}</Text>
                <Text className="text-[10px] text-muted">Cleaves 35% of all strikes</Text>
              </View>
            </View>
            <Text className="text-xs font-bold tabular-nums text-foreground">
              {weeklyHpPercent}%
            </Text>
          </View>
          <View className="h-2 w-full bg-border rounded-full overflow-hidden">
            <View style={{ width: `${weeklyHpPercent}%`, backgroundColor: "#2B6CB0", height: "100%" }} />
          </View>
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-border mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="whatshot" size={18} color="#805AD5" />
              <View>
                <Text className="text-sm font-bold text-foreground">{monthlyBoss.name}</Text>
                <Text className="text-[10px] text-muted">Cleaves 15% (Unlocks TRK Tokens)</Text>
              </View>
            </View>
            <Text className="text-xs font-bold tabular-nums text-foreground">
              {monthlyHpPercent}%
            </Text>
          </View>
          <View className="h-2 w-full bg-border rounded-full overflow-hidden">
            <View style={{ width: `${monthlyHpPercent}%`, backgroundColor: "#805AD5", height: "100%" }} />
          </View>
        </View>

        {/* Co-op Mechanics Info Card */}
        <View className="bg-canvas rounded-2xl p-4 border border-border">
          <Text className="text-xs font-bold uppercase tracking-wider text-foreground mb-1">
            Duo Habit Pact
          </Text>
          <Text className="text-xs text-muted leading-relaxed">
            Every transaction strike damages the active boss. Log consistently before midnight to maintain your streak multiplier (up to 2.0x damage)!
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
    top: 50,
    right: 25,
    backgroundColor: "#D92C3B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  floatingText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },
});
