import React, { useState } from "react";
import { ScrollView, Text, View, Pressable, Switch } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useTraki } from "@/src/context/TrakiContext";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";

export default function ProfileScreen() {
  const { profile } = useTraki();
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const [showMechanics, setShowMechanics] = useState(false);

  const expToNextLevel = (profile?.level ?? 1) * 200;
  const expProgressPercent = Math.min(
    100,
    Math.round(((profile?.exp ?? 0) / expToNextLevel) * 100)
  );

  return (
    <ScreenContainer className="px-4 pt-2">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="py-3 mb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-[10px] font-extrabold uppercase tracking-widest text-muted">
              Player Status
            </Text>
            <Text className="text-2xl font-black text-foreground">Profile & Duo</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View className="bg-surface rounded-3xl p-5 border border-border mb-5 shadow-sm">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="h-16 w-16 rounded-2xl bg-canvas border border-border items-center justify-center">
              <Text className="text-2xl font-black text-foreground">JP</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-black text-foreground">Irish P.</Text>
                <View className="bg-primary/15 px-2.5 py-0.5 rounded-md">
                  <Text className="text-[10px] font-black text-primary">
                    LVL {profile?.level ?? 1}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-muted font-medium mt-0.5">
                Co-op Duo Partner: {profile?.partner_name ?? "Kira"}
              </Text>
            </View>
          </View>

          {/* Level Progress */}
          <View>
            <View className="flex-row justify-between mb-1.5">
              <Text className="text-xs font-bold text-muted">Level Progression</Text>
              <Text className="text-xs font-black text-foreground tabular-nums">
                {profile?.exp ?? 0} / {expToNextLevel} EXP ({expProgressPercent}%)
              </Text>
            </View>
            <View className="h-2 w-full bg-border rounded-full overflow-hidden">
              <View style={{ width: `${expProgressPercent}%`, backgroundColor: colors.primary, height: "100%" }} />
            </View>
          </View>
        </View>

        {/* Co-op Duo Stats */}
        <Text className="text-xs font-extrabold uppercase tracking-wider text-muted mb-2.5">
          Duo Momentum
        </Text>
        <View className="flex-row gap-3 mb-5">
          <View className="bg-surface rounded-2xl p-4 border border-border flex-1 shadow-2xs">
            <Text className="text-[11px] font-bold text-muted">Current Streak</Text>
            <Text className="text-2xl font-black text-foreground mt-1">
              {profile?.current_streak ?? 1} Days
            </Text>
          </View>
          <View className="bg-surface rounded-2xl p-4 border border-border flex-1 shadow-2xs">
            <Text className="text-[11px] font-bold text-muted">Best Streak</Text>
            <Text className="text-2xl font-black text-foreground mt-1">
              {profile?.highest_streak ?? 1} Days
            </Text>
          </View>
        </View>

        {/* Settings & Preferences */}
        <Text className="text-xs font-extrabold uppercase tracking-wider text-muted mb-2.5">
          Preferences & Lore
        </Text>

        <View className="bg-surface rounded-2xl border border-border overflow-hidden mb-5 shadow-2xs">
          {/* Theme Toggle */}
          <View className="p-4 flex-row items-center justify-between border-b border-border">
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="dark-mode" size={20} color={colors.foreground} />
              <Text className="text-sm font-bold text-foreground">Dark Mode</Text>
            </View>
            <Switch
              value={colorScheme === "dark"}
              onValueChange={(val) => setColorScheme(val ? "dark" : "light")}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {/* How Traki Works */}
          <Pressable
            onPress={() => setShowMechanics(!showMechanics)}
            className="p-4 flex-row items-center justify-between border-b border-border"
          >
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="menu-book" size={20} color={colors.foreground} />
              <Text className="text-sm font-bold text-foreground">How Traki Works</Text>
            </View>
            <MaterialIcons
              name={showMechanics ? "expand-less" : "expand-more"}
              size={20}
              color={colors.muted}
            />
          </Pressable>

          {showMechanics && (
            <View className="p-4 bg-canvas border-b border-border">
              <Text className="text-xs font-black uppercase text-primary mb-1">
                01 Build your streak
              </Text>
              <Text className="text-xs text-muted mb-3 leading-relaxed">
                Log everyday expenses and habit decisions. Every log strikes the daily mob and scales your streak multiplier (up to 2.0x damage).
              </Text>

              <Text className="text-xs font-black uppercase text-primary mb-1">
                02 Concurrent Cleave
              </Text>
              <Text className="text-xs text-muted mb-3 leading-relaxed">
                Strikes deal 100% damage to the Daily Mob, 35% cleave to the Weekly Miniboss, and 15% cleave to the Monthly Titan.
              </Text>

              <Text className="text-xs font-black uppercase text-primary mb-1">
                03 Dual-Key Savings Vault
              </Text>
              <Text className="text-xs text-muted leading-relaxed">
                High-tier savings goals require both actual funds saved AND earned TRK tokens from Weekly/Monthly boss victories.
              </Text>
            </View>
          )}

          {/* Deep link indicator */}
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <MaterialIcons name="touch-app" size={20} color={colors.foreground} />
              <View>
                <Text className="text-sm font-bold text-foreground">Apple Back Tap</Text>
                <Text className="text-[11px] text-muted">URL: traki://quick-log</Text>
              </View>
            </View>
            <View className="bg-green-100 dark:bg-green-950/60 px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-black text-success">READY</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center py-2">
          <Text className="text-xs font-bold text-muted">
            Traki v0.1.0 • 16-Bit Gamified Financial Tracker
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
