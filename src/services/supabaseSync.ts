import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient";
import { TrakiStorage } from "./db";
import { SyncState } from "../types";

let currentSyncState: SyncState = {
  status: "idle",
  lastSyncedAt: null,
  pendingCount: 0,
};

type SyncListener = (state: SyncState) => void;
const listeners = new Set<SyncListener>();

const notifyListeners = () => {
  listeners.forEach((l) => l({ ...currentSyncState }));
};

export const SupabaseSyncService = {
  getSyncState: (): SyncState => ({ ...currentSyncState }),

  subscribe: (listener: SyncListener): (() => void) => {
    listeners.add(listener);
    listener({ ...currentSyncState });
    return () => listeners.delete(listener);
  },

  syncAll: async (): Promise<SyncState> => {
    const supabase = getSupabaseClient();

    // Check offline status
    if (!supabase || !isSupabaseConfigured()) {
      const unsynced = await TrakiStorage.getUnsyncedTransactions();
      currentSyncState = {
        status: "offline",
        lastSyncedAt: currentSyncState.lastSyncedAt,
        pendingCount: unsynced.length,
      };
      notifyListeners();
      return currentSyncState;
    }

    try {
      currentSyncState.status = "syncing";
      notifyListeners();

      // 1. Sync Pending Transactions (Outbox Pattern)
      const unsyncedTx = await TrakiStorage.getUnsyncedTransactions();
      currentSyncState.pendingCount = unsyncedTx.length;

      if (unsyncedTx.length > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const rowsToInsert = unsyncedTx.map((tx) => ({
          id: tx.id,
          user_id: user?.id || null,
          amount: tx.amount,
          type: tx.type,
          category_id: tx.category_id,
          wallet_id: tx.wallet_id,
          note: tx.note,
          created_at: tx.created_at,
        }));

        const { error: txError } = await supabase
          .from("transactions")
          .upsert(rowsToInsert, { onConflict: "id" });

        if (!txError) {
          const syncedIds = unsyncedTx.map((t) => t.id);
          await TrakiStorage.markTransactionsSynced(syncedIds);
          currentSyncState.pendingCount = 0;
        } else {
          console.warn("Supabase transaction push note:", txError.message);
        }
      }

      // 2. Sync Profile Stats
      const profile = await TrakiStorage.getProfile();
      if (profile) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              username: profile.partner_name ? "Hunter" : "Player One",
              level: profile.level,
              exp: profile.exp,
              gold: profile.gold,
              trk_tokens: profile.trk_tokens,
              current_streak: profile.current_streak,
              highest_streak: profile.highest_streak,
              streak_shields: profile.streak_shields,
              last_logged_date: profile.last_logged_date,
              partner_name: profile.partner_name,
              partner_streak: profile.partner_streak,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );
        }
      }

      // 3. Sync Wallets
      const wallets = await TrakiStorage.getWallets();
      if (wallets.length > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const walletRows = wallets.map((w) => ({
            id: w.id,
            user_id: user.id,
            name: w.name,
            type: w.type,
            balance: w.balance,
            currency: w.currency,
            color: w.color,
          }));
          await supabase.from("wallets").upsert(walletRows, { onConflict: "id" });
        }
      }

      // 4. Sync Categories
      const categories = await TrakiStorage.getCategories();
      if (categories.length > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const catRows = categories.map((c) => ({
            id: c.id,
            user_id: user.id,
            name: c.name,
            icon: c.icon,
            budget_cap: c.budget_cap,
            color: c.color,
          }));
          await supabase.from("categories").upsert(catRows, { onConflict: "id" });
        }
      }

      currentSyncState = {
        status: "synced",
        lastSyncedAt: new Date(),
        pendingCount: 0,
      };
      notifyListeners();
    } catch (err: any) {
      console.warn("Offline or sync connection notice:", err.message);
      currentSyncState = {
        status: "offline",
        lastSyncedAt: currentSyncState.lastSyncedAt,
        pendingCount: currentSyncState.pendingCount,
        errorMessage: err.message,
      };
      notifyListeners();
    }

    return currentSyncState;
  },
};
