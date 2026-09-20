import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Wallet,
  Category,
  Transaction,
  PlayerProfile,
  BossEncounter,
  SavingsGoal,
  CombatStrikeResult,
} from "../types";
import { TrakiStorage } from "../services/db";
import { calculateCombatStrike } from "../services/combatEngine";
import { evaluateStreakOnAction, formatCents, parseToCents } from "../services/economyService";

interface TrakiContextType {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  profile: PlayerProfile | null;
  bosses: BossEncounter[];
  goals: SavingsGoal[];
  isLoading: boolean;
  logTransaction: (
    amountInput: string | number,
    categoryId: string,
    walletId: string,
    note?: string
  ) => Promise<CombatStrikeResult>;
  buyShopItem: (itemTitle: string, priceGold: number, rewardType: "shield" | "multiplier") => Promise<boolean>;
  unlockGoal: (goalId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const TrakiContext = createContext<TrakiContextType | null>(null);

export function TrakiProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [bosses, setBosses] = useState<BossEncounter[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = async () => {
    try {
      const [w, c, t, p, b, g] = await Promise.all([
        TrakiStorage.getWallets(),
        TrakiStorage.getCategories(),
        TrakiStorage.getTransactions(),
        TrakiStorage.getProfile(),
        TrakiStorage.getBosses(),
        TrakiStorage.getGoals(),
      ]);
      setWallets(w);
      setCategories(c);
      setTransactions(t);
      setProfile(p);
      setBosses(b);
      setGoals(g);
    } catch (e) {
      console.error("Error loading Traki data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const logTransaction = async (
    amountInput: string | number,
    categoryId: string,
    walletId: string,
    note = "Quick Entry"
  ): Promise<CombatStrikeResult> => {
    const amountInCents = parseToCents(amountInput);
    const todayStr = new Date().toISOString().split("T")[0];

    // Count today's transactions for anti-spam diminishing returns
    const todayLogs = transactions.filter((tx) => tx.created_at.startsWith(todayStr)).length;
    const streakDays = profile?.current_streak ?? 1;

    // Calculate combat strike
    const strike = calculateCombatStrike({
      streakDays,
      todayLogCount: todayLogs,
    });

    const goldEarned = Math.round(strike.totalDamage * 0.5);
    const expEarned = Math.round(strike.totalDamage * 0.25);

    // Evaluate streak & shield consumption
    const streakResult = profile
      ? evaluateStreakOnAction(profile, todayStr)
      : { currentStreak: 1, consumedShield: false, shieldsRemaining: 1, streakReset: false };

    // Record transaction
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      amount: amountInCents,
      type: "expense",
      category_id: categoryId,
      wallet_id: walletId,
      note,
      created_at: new Date().toISOString(),
      is_synced: 0,
    };

    await TrakiStorage.saveTransaction(newTx, amountInCents);
    await TrakiStorage.applyCombatCleave(
      strike.dailyDamage,
      strike.weeklyCleave,
      strike.monthlyCleave,
      goldEarned,
      expEarned
    );

    const highestStreak = Math.max(profile?.highest_streak ?? 1, streakResult.currentStreak);
    await TrakiStorage.updateProfile({
      current_streak: streakResult.currentStreak,
      highest_streak: highestStreak,
      streak_shields: streakResult.shieldsRemaining,
      last_logged_date: todayStr,
    });

    await loadAll();

    return {
      baseDamage: strike.baseDamage,
      isCrit: strike.isCrit,
      critMultiplier: strike.critMultiplier,
      streakMultiplier: strike.streakMultiplier,
      diminishingPenalty: strike.diminishingMultiplier,
      totalDamage: strike.totalDamage,
      dailyCleave: strike.dailyDamage,
      weeklyCleave: strike.weeklyCleave,
      monthlyCleave: strike.monthlyCleave,
      goldEarned,
      expEarned,
      defeatedBosses: [],
    };
  };

  const buyShopItem = async (
    _itemTitle: string,
    priceGold: number,
    rewardType: "shield" | "multiplier"
  ): Promise<boolean> => {
    if (!profile || profile.gold < priceGold) return false;
    const updates: Partial<PlayerProfile> = {
      gold: profile.gold - priceGold,
    };
    if (rewardType === "shield") {
      updates.streak_shields = (profile.streak_shields ?? 0) + 1;
    }
    await TrakiStorage.updateProfile(updates);
    await loadAll();
    return true;
  };

  const unlockGoal = async (goalId: string): Promise<boolean> => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !profile) return false;
    if (goal.current_amount < goal.target_amount || profile.trk_tokens < goal.trk_tokens_required) {
      return false;
    }

    await TrakiStorage.updateProfile({
      trk_tokens: profile.trk_tokens - goal.trk_tokens_required,
    });
    goal.is_unlocked = 1;
    await loadAll();
    return true;
  };

  return (
    <TrakiContext.Provider
      value={{
        wallets,
        categories,
        transactions,
        profile,
        bosses,
        goals,
        isLoading,
        logTransaction,
        buyShopItem,
        unlockGoal,
        refreshData: loadAll,
      }}
    >
      {children}
    </TrakiContext.Provider>
  );
}

export function useTraki() {
  const ctx = useContext(TrakiContext);
  if (!ctx) {
    throw new Error("useTraki must be used within a TrakiProvider");
  }
  return ctx;
}
