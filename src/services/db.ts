import { Platform } from "react-native";
import {
  Wallet,
  Category,
  Transaction,
  PlayerProfile,
  BossEncounter,
  SavingsGoal,
  AuthSession,
} from "../types";

let dbInstance: any = null;

// In-memory fallback for web environment — starts EMPTY (no mock data)
const memoryStore = {
  authSession: null as AuthSession | null,
  wallets: [] as Wallet[],
  categories: [] as Category[],
  transactions: [] as Transaction[],
  profile: {
    id: "player_1",
    level: 1,
    exp: 0,
    gold: 0,
    trk_tokens: 0,
    current_streak: 1,
    highest_streak: 1,
    streak_shields: 1,
    last_logged_date: null,
    partner_name: undefined,
    partner_id: undefined,
    partner_streak: 0,
  } as PlayerProfile,
  bosses: [] as BossEncounter[],
  goals: [] as SavingsGoal[],
};

// Default boss encounters (game mechanic, auto-seeded on first launch)
const DEFAULT_BOSSES: BossEncounter[] = [
  {
    id: "boss_daily",
    tier: "daily",
    name: "Imp of Impulsive Buys",
    title: "Daily Mob",
    max_hp: 500,
    current_hp: 500,
    gold_reward: 120,
    trk_reward: 0,
    exp_reward: 50,
    sprite_key: "goblin",
    expires_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    is_defeated: 0,
  },
  {
    id: "boss_weekly",
    tier: "weekly",
    name: "The Interest Behemoth",
    title: "Weekly Miniboss",
    max_hp: 2000,
    current_hp: 2000,
    gold_reward: 500,
    trk_reward: 3,
    exp_reward: 250,
    sprite_key: "behemoth",
    expires_at: new Date(Date.now() + 4 * 86400 * 1000).toISOString(),
    is_defeated: 0,
  },
  {
    id: "boss_monthly",
    tier: "monthly",
    name: "Titan of Inflation",
    title: "Monthly Titan",
    max_hp: 8000,
    current_hp: 8000,
    gold_reward: 2000,
    trk_reward: 10,
    exp_reward: 1000,
    sprite_key: "titan",
    expires_at: new Date(Date.now() + 18 * 86400 * 1000).toISOString(),
    is_defeated: 0,
  },
];

export async function getDatabase() {
  if (Platform.OS === "web") {
    return null;
  }
  if (!dbInstance) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const SQLite = require("expo-sqlite");
      dbInstance = await SQLite.openDatabaseAsync("traki.db");
      await initializeDatabase(dbInstance);
    } catch (e) {
      console.warn("Failed to open SQLite database, falling back to memory store:", e);
      return null;
    }
  }
  return dbInstance;
}

async function initializeDatabase(db: any) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'PHP',
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      budget_cap INTEGER,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      category_id TEXT NOT NULL,
      wallet_id TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      is_synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_tx_wallet ON transactions(wallet_id);
    CREATE INDEX IF NOT EXISTS idx_tx_cat ON transactions(category_id);

    CREATE TABLE IF NOT EXISTS player_profile (
      id TEXT PRIMARY KEY,
      level INTEGER NOT NULL DEFAULT 1,
      exp INTEGER NOT NULL DEFAULT 0,
      gold INTEGER NOT NULL DEFAULT 0,
      trk_tokens INTEGER NOT NULL DEFAULT 0,
      current_streak INTEGER NOT NULL DEFAULT 1,
      highest_streak INTEGER NOT NULL DEFAULT 1,
      streak_shields INTEGER NOT NULL DEFAULT 1,
      last_logged_date TEXT,
      partner_id TEXT,
      partner_name TEXT,
      partner_streak INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS boss_encounters (
      id TEXT PRIMARY KEY,
      tier TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      max_hp INTEGER NOT NULL,
      current_hp INTEGER NOT NULL,
      gold_reward INTEGER NOT NULL,
      trk_reward INTEGER NOT NULL,
      exp_reward INTEGER NOT NULL,
      sprite_key TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      is_defeated INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_boss_tier ON boss_encounters(tier);

    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      target_amount INTEGER NOT NULL,
      current_amount INTEGER NOT NULL DEFAULT 0,
      trk_tokens_required INTEGER NOT NULL DEFAULT 0,
      is_unlocked INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      icon TEXT NOT NULL,
      tone TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_session (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      provider TEXT NOT NULL,
      token TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Seed default profile if none exists (clean start, no mock balances)
  const profileRow = await db.getFirstAsync("SELECT id FROM player_profile LIMIT 1");
  if (!profileRow) {
    await db.runAsync(
      `INSERT INTO player_profile (id, level, exp, gold, trk_tokens, current_streak, highest_streak, streak_shields, last_logged_date, partner_name, partner_streak)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        memoryStore.profile.id,
        memoryStore.profile.level,
        memoryStore.profile.exp,
        memoryStore.profile.gold,
        memoryStore.profile.trk_tokens,
        memoryStore.profile.current_streak,
        memoryStore.profile.highest_streak,
        memoryStore.profile.streak_shields,
        memoryStore.profile.last_logged_date,
        memoryStore.profile.partner_name ?? null,
        memoryStore.profile.partner_streak ?? 0,
      ]
    );
  }

  // Seed default boss encounters if none exist (game mechanic, not user data)
  const bossRow = await db.getFirstAsync("SELECT id FROM boss_encounters LIMIT 1");
  if (!bossRow) {
    for (const b of DEFAULT_BOSSES) {
      await db.runAsync(
        `INSERT OR IGNORE INTO boss_encounters (id, tier, name, title, max_hp, current_hp, gold_reward, trk_reward, exp_reward, sprite_key, expires_at, is_defeated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.id, b.tier, b.name, b.title, b.max_hp, b.current_hp, b.gold_reward, b.trk_reward, b.exp_reward, b.sprite_key, b.expires_at, b.is_defeated]
      );
    }
  }
}

export const TrakiStorage = {
  // ─── READ OPERATIONS ────────────────────────────────────────────────

  getWallets: async (): Promise<Wallet[]> => {
    const db = await getDatabase();
    if (!db) return memoryStore.wallets;
    const rows = await db.getAllAsync("SELECT * FROM wallets");
    return rows as Wallet[];
  },

  getCategories: async (): Promise<Category[]> => {
    const db = await getDatabase();
    if (!db) return memoryStore.categories;
    const rows = await db.getAllAsync("SELECT * FROM categories");
    return rows as Category[];
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const db = await getDatabase();
    if (!db) return memoryStore.transactions;
    const rows = await db.getAllAsync("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 50");
    return rows as Transaction[];
  },

  getProfile: async (): Promise<PlayerProfile> => {
    const db = await getDatabase();
    if (!db) return memoryStore.profile;
    const row = await db.getFirstAsync("SELECT * FROM player_profile LIMIT 1");
    return (row as PlayerProfile) || memoryStore.profile;
  },

  getBosses: async (): Promise<BossEncounter[]> => {
    const db = await getDatabase();
    if (!db) return memoryStore.bosses.length ? memoryStore.bosses : DEFAULT_BOSSES;
    const rows = await db.getAllAsync("SELECT * FROM boss_encounters");
    return rows.length ? (rows as BossEncounter[]) : DEFAULT_BOSSES;
  },

  getGoals: async (): Promise<SavingsGoal[]> => {
    const db = await getDatabase();
    if (!db) return memoryStore.goals;
    const rows = await db.getAllAsync("SELECT * FROM savings_goals");
    return rows as SavingsGoal[];
  },

  // ─── SYNC HELPERS ───────────────────────────────────────────────────

  getUnsyncedTransactions: async (): Promise<Transaction[]> => {
    const db = await getDatabase();
    if (!db) return memoryStore.transactions.filter((t) => t.is_synced === 0);
    const rows = await db.getAllAsync("SELECT * FROM transactions WHERE is_synced = 0 ORDER BY created_at DESC");
    return rows as Transaction[];
  },

  markTransactionsSynced: async (ids: string[]): Promise<void> => {
    if (ids.length === 0) return;
    const db = await getDatabase();
    if (!db) {
      memoryStore.transactions.forEach((t) => {
        if (ids.includes(t.id)) t.is_synced = 1;
      });
      return;
    }
    const placeholders = ids.map(() => "?").join(",");
    await db.runAsync(`UPDATE transactions SET is_synced = 1 WHERE id IN (${placeholders})`, ids);
  },

  // ─── WRITE OPERATIONS ──────────────────────────────────────────────

  saveTransaction: async (tx: Transaction, walletDeduction: number): Promise<void> => {
    const db = await getDatabase();
    if (!db) {
      memoryStore.transactions.unshift(tx);
      const w = memoryStore.wallets.find((x) => x.id === tx.wallet_id);
      if (w) w.balance -= walletDeduction;
      return;
    }

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT INTO transactions (id, amount, type, category_id, wallet_id, note, created_at, is_synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tx.id, tx.amount, tx.type, tx.category_id, tx.wallet_id, tx.note, tx.created_at, tx.is_synced]
      );

      await db.runAsync(
        `UPDATE wallets SET balance = balance - ? WHERE id = ?`,
        [walletDeduction, tx.wallet_id]
      );
    });
  },

  addWallet: async (wallet: Wallet): Promise<void> => {
    const db = await getDatabase();
    if (!db) {
      memoryStore.wallets.push(wallet);
      return;
    }
    await db.runAsync(
      `INSERT INTO wallets (id, name, type, balance, currency, color) VALUES (?, ?, ?, ?, ?, ?)`,
      [wallet.id, wallet.name, wallet.type, wallet.balance, wallet.currency, wallet.color]
    );
  },

  updateWallet: async (id: string, partial: Partial<Wallet>): Promise<void> => {
    const db = await getDatabase();
    if (!db) {
      const w = memoryStore.wallets.find((x) => x.id === id);
      if (w) Object.assign(w, partial);
      return;
    }
    const sets: string[] = [];
    const vals: any[] = [];
    Object.entries(partial).forEach(([k, v]) => {
      sets.push(`${k} = ?`);
      vals.push(v);
    });
    if (sets.length) {
      vals.push(id);
      await db.runAsync(`UPDATE wallets SET ${sets.join(", ")} WHERE id = ?`, vals);
    }
  },

  deleteWallet: async (id: string): Promise<void> => {
    const db = await getDatabase();
    if (!db) {
      memoryStore.wallets = memoryStore.wallets.filter((w) => w.id !== id);
      return;
    }
    await db.runAsync("DELETE FROM wallets WHERE id = ?", [id]);
  },

  addCategory: async (category: Category): Promise<void> => {
    const db = await getDatabase();
    if (!db) {
      memoryStore.categories.push(category);
      return;
    }
    await db.runAsync(
      `INSERT INTO categories (id, name, icon, budget_cap, color) VALUES (?, ?, ?, ?, ?)`,
      [category.id, category.name, category.icon, category.budget_cap ?? null, category.color]
    );
  },

  addSavingsGoal: async (goal: SavingsGoal): Promise<void> => {
    const db = await getDatabase();
    if (!db) {
      memoryStore.goals.push(goal);
      return;
    }
    await db.runAsync(
      `INSERT INTO savings_goals (id, title, target_amount, current_amount, trk_tokens_required, is_unlocked, category, icon, tone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [goal.id, goal.title, goal.target_amount, goal.current_amount, goal.trk_tokens_required, goal.is_unlocked, goal.category, goal.icon, goal.tone]
    );
  },

  updateSavingsGoal: async (id: string, partial: Partial<SavingsGoal>): Promise<void> => {
    const db = await getDatabase();
    if (!db) {
      const g = memoryStore.goals.find((x) => x.id === id);
      if (g) Object.assign(g, partial);
      return;
    }
    const sets: string[] = [];
    const vals: any[] = [];
    Object.entries(partial).forEach(([k, v]) => {
      sets.push(`${k} = ?`);
      vals.push(v);
    });
    if (sets.length) {
      vals.push(id);
      await db.runAsync(`UPDATE savings_goals SET ${sets.join(", ")} WHERE id = ?`, vals);
    }
  },

  // ─── COMBAT OPERATIONS ─────────────────────────────────────────────

  applyCombatCleave: async (
    dailyDamage: number,
    weeklyDamage: number,
    monthlyDamage: number,
    goldReward: number,
    expReward: number
  ): Promise<void> => {
    const db = await getDatabase();
    if (!db) {
      const daily = memoryStore.bosses.find((b) => b.tier === "daily");
      if (daily) daily.current_hp = Math.max(0, daily.current_hp - dailyDamage);
      const weekly = memoryStore.bosses.find((b) => b.tier === "weekly");
      if (weekly) weekly.current_hp = Math.max(0, weekly.current_hp - weeklyDamage);
      const monthly = memoryStore.bosses.find((b) => b.tier === "monthly");
      if (monthly) monthly.current_hp = Math.max(0, monthly.current_hp - monthlyDamage);
      memoryStore.profile.gold += goldReward;
      memoryStore.profile.exp += expReward;
      return;
    }

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE boss_encounters SET current_hp = MAX(0, current_hp - ?) WHERE tier = 'daily'`,
        [dailyDamage]
      );
      await db.runAsync(
        `UPDATE boss_encounters SET current_hp = MAX(0, current_hp - ?) WHERE tier = 'weekly'`,
        [weeklyDamage]
      );
      await db.runAsync(
        `UPDATE boss_encounters SET current_hp = MAX(0, current_hp - ?) WHERE tier = 'monthly'`,
        [monthlyDamage]
      );
      await db.runAsync(
        `UPDATE player_profile SET gold = gold + ?, exp = exp + ?`,
        [goldReward, expReward]
      );
    });
  },

  updateProfile: async (partial: Partial<PlayerProfile>): Promise<void> => {
    Object.assign(memoryStore.profile, partial);
    const db = await getDatabase();
    if (!db) return;
    const sets: string[] = [];
    const vals: any[] = [];
    Object.entries(partial).forEach(([k, v]) => {
      sets.push(`${k} = ?`);
      vals.push(v ?? null);
    });
    if (sets.length) {
      await db.runAsync(`UPDATE player_profile SET ${sets.join(", ")}`, vals);
    }
  },

  // ─── AUTH SESSION ──────────────────────────────────────────────────

  saveAuthSession: async (session: AuthSession): Promise<void> => {
    memoryStore.authSession = session;
    const db = await getDatabase();
    if (!db) return;
    await db.runAsync("DELETE FROM auth_session");
    await db.runAsync(
      `INSERT INTO auth_session (id, email, display_name, avatar_url, provider, token, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.email,
        session.display_name,
        session.avatar_url ?? null,
        session.provider,
        session.token ?? null,
        session.created_at,
      ]
    );
  },

  getAuthSession: async (): Promise<AuthSession | null> => {
    const db = await getDatabase();
    if (!db) return memoryStore.authSession;
    const row = await db.getFirstAsync("SELECT * FROM auth_session LIMIT 1");
    if (!row) return memoryStore.authSession;
    return row as AuthSession;
  },

  clearAuthSession: async (): Promise<void> => {
    memoryStore.authSession = null;
    const db = await getDatabase();
    if (!db) return;
    await db.runAsync("DELETE FROM auth_session");
  },

  clearAll: async (): Promise<void> => {
    memoryStore.authSession = null;
    memoryStore.wallets = [];
    memoryStore.categories = [];
    memoryStore.transactions = [];
    memoryStore.goals = [];
    memoryStore.bosses = [];
    memoryStore.profile = {
      id: "player_1",
      level: 1,
      exp: 0,
      gold: 0,
      trk_tokens: 0,
      current_streak: 1,
      highest_streak: 1,
      streak_shields: 1,
      last_logged_date: null,
      partner_name: undefined,
      partner_id: undefined,
      partner_streak: 0,
    };
    const db = await getDatabase();
    if (!db) return;
    await db.execAsync(`
      DELETE FROM auth_session;
      DELETE FROM transactions;
      DELETE FROM wallets;
      DELETE FROM categories;
      DELETE FROM savings_goals;
      DELETE FROM bosses;
    `);
  },
};

