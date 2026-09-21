import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  Wallet,
  Category,
  Transaction,
  PlayerProfile,
  BossEncounter,
  SavingsGoal,
  CombatStrikeResult,
  SyncState,
} from "../types";
import { TrakiStorage } from "../services/db";
import { calculateCombatStrike } from "../services/combatEngine";
import { evaluateStreakOnAction, parseToCents } from "../services/economyService";
import { SupabaseSyncService } from "../services/supabaseSync";
import { CombatEventBus } from "../services/combatEvents";

interface TrakiContextType {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  profile: PlayerProfile | null;
  bosses: BossEncounter[];
  goals: SavingsGoal[];
  isLoading: boolean;
  syncState: SyncState;
  logTransaction: (
    amountInput: string | number,
    categoryId: string,
    walletId: string,
    note?: string
  ) => Promise<CombatStrikeResult>;
  addWallet: (wallet: Omit<Wallet, "id">) => Promise<void>;
  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  addSavingsGoal: (goal: Omit<SavingsGoal, "id" | "is_unlocked" | "current_amount">) => Promise<void>;
  buyShopItem: (itemTitle: string, priceGold: number, rewardType: "shield" | "multiplier") => Promise<boolean>;
  unlockGoal: (goalId: string) => Promise<boolean>;
  depositToGoal: (goalId: string, amountCents: number) => Promise<void>;
  syncNow: () => Promise<void>;
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
  const [syncState, setSyncState] = useState<SyncState>({
    status: "idle",
    lastSyncedAt: null,
    pendingCount: 0,
  });

  const loadAll = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [loadAll]);

  // Subscribe to sync state changes
  useEffect(() => {
    const unsub = SupabaseSyncService.subscribe(setSyncState);
    return unsub;
  }, []);

  const logTransaction = useCallback(async (
    amountInput: string | number,
    categoryId: string,
    walletId: string,
    note = "Quick Entry"
  ): Promise<CombatStrikeResult> => {
    const amountInCents = parseToCents(amountInput);
    const todayStr = new Date().toISOString().split("T")[0];

    const todayLogs = transactions.filter((tx) => tx.created_at.startsWith(todayStr)).length;
    const streakDays = profile?.current_streak ?? 1;

    const strike = calculateCombatStrike({
      streakDays,
      todayLogCount: todayLogs,
    });

    const goldEarned = Math.round(strike.totalDamage * 0.5);
    const expEarned = Math.round(strike.totalDamage * 0.25);

    const streakResult = profile
      ? evaluateStreakOnAction(profile, todayStr)
      : { currentStreak: 1, consumedShield: false, shieldsRemaining: 1, streakReset: false };

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

    const combatResult: CombatStrikeResult = {
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

    // Emit event to 2D Battle Arena Stage via Event Bus
    CombatEventBus.emitCombatStrike({
      id: newTx.id,
      amount: amountInCents / 100,
      label: note,
      strikeResult: combatResult,
      timestamp: Date.now(),
    });

    return combatResult;
  }, [transactions, profile, loadAll]);

  const addWallet = useCallback(async (walletData: Omit<Wallet, "id">) => {
    const wallet: Wallet = {
      ...walletData,
      id: `w_${Date.now()}`,
    };
    await TrakiStorage.addWallet(wallet);
    await loadAll();
  }, [loadAll]);

  const addCategory = useCallback(async (catData: Omit<Category, "id">) => {
    const category: Category = {
      ...catData,
      id: `c_${Date.now()}`,
    };
    await TrakiStorage.addCategory(category);
    await loadAll();
  }, [loadAll]);

  const addSavingsGoal = useCallback(async (
    goalData: Omit<SavingsGoal, "id" | "is_unlocked" | "current_amount">
  ) => {
    const goal: SavingsGoal = {
      ...goalData,
      id: `g_${Date.now()}`,
      current_amount: 0,
      is_unlocked: 0,
    };
    await TrakiStorage.addSavingsGoal(goal);
    await loadAll();
  }, [loadAll]);

  const depositToGoal = useCallback(async (goalId: string, amountCents: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    await TrakiStorage.updateSavingsGoal(goalId, {
      current_amount: goal.current_amount + amountCents,
    });
    await loadAll();
  }, [goals, loadAll]);

  const buyShopItem = useCallback(async (
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
  }, [profile, loadAll]);

  const unlockGoal = useCallback(async (goalId: string): Promise<boolean> => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || !profile) return false;
    if (goal.current_amount < goal.target_amount || profile.trk_tokens < goal.trk_tokens_required) {
      return false;
    }

    await TrakiStorage.updateProfile({
      trk_tokens: profile.trk_tokens - goal.trk_tokens_required,
    });
    await TrakiStorage.updateSavingsGoal(goalId, { is_unlocked: 1 });
    await loadAll();
    return true;
  }, [goals, profile, loadAll]);

  const syncNow = useCallback(async () => {
    await SupabaseSyncService.syncAll();
  }, []);

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
        syncState,
        logTransaction,
        addWallet,
        addCategory,
        addSavingsGoal,
        buyShopItem,
        unlockGoal,
        depositToGoal,
        syncNow,
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
