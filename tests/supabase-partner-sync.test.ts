import { describe, it, expect, beforeEach } from "vitest";
import { TrakiStorage } from "../src/services/db";
import { PartnerService } from "../src/services/partnerService";
import { SupabaseSyncService } from "../src/services/supabaseSync";

describe("Database Clean State & CRUD Suite", () => {
  beforeEach(async () => {
    await TrakiStorage.clearAll();
  });

  it("initializes with empty wallets, categories, transactions, and goals (no hardcoded mock data)", async () => {
    const [wallets, categories, transactions, goals] = await Promise.all([
      TrakiStorage.getWallets(),
      TrakiStorage.getCategories(),
      TrakiStorage.getTransactions(),
      TrakiStorage.getGoals(),
    ]);

    expect(wallets).toEqual([]);
    expect(categories).toEqual([]);
    expect(transactions).toEqual([]);
    expect(goals).toEqual([]);
  });

  it("supports adding a wallet dynamically", async () => {
    const newWallet = {
      id: "w_test_1",
      name: "Main Checking",
      type: "bank" as const,
      balance: 15000,
      currency: "PHP",
      color: "#3B82F6",
      is_archived: 0,
      created_at: new Date().toISOString(),
    };
    await TrakiStorage.addWallet(newWallet);

    const wallets = await TrakiStorage.getWallets();
    expect(wallets.length).toBe(1);
    expect(wallets[0].name).toBe("Main Checking");
    expect(wallets[0].balance).toBe(15000);
  });

  it("supports adding categories dynamically", async () => {
    const newCat = {
      id: "c_test_1",
      name: "Food & Dining",
      icon: "restaurant",
      color: "#EF4444",
      budget_cap: 8000,
      created_at: new Date().toISOString(),
    };
    await TrakiStorage.addCategory(newCat);

    const categories = await TrakiStorage.getCategories();
    expect(categories.length).toBe(1);
    expect(categories[0].name).toBe("Food & Dining");
  });

  it("supports adding savings goals dynamically and updating deposits", async () => {
    const goal = {
      id: "g_test_1",
      title: "Emergency Fund",
      target_amount: 50000,
      current_amount: 0,
      trk_tokens_required: 50,
      is_unlocked: 0,
      category: "Shields",
      icon: "savings",
      tone: "safety" as const,
    };
    await TrakiStorage.addSavingsGoal(goal);

    let goals = await TrakiStorage.getGoals();
    expect(goals.length).toBe(1);
    expect(goals[0].title).toBe("Emergency Fund");

    await TrakiStorage.updateSavingsGoal("g_test_1", { current_amount: 5000 });
    goals = await TrakiStorage.getGoals();
    expect(goals[0].current_amount).toBe(5000);
  });
});

describe("Partner Service Suite", () => {
  beforeEach(async () => {
    await TrakiStorage.clearAll();
  });

  it("generates a 4-digit partner invite code in local/offline fallback", async () => {
    const result = await PartnerService.generatePartnerCode();
    expect(result).not.toBeNull();
    expect(result?.code).toBeDefined();
    expect(result?.code.length).toBe(4);
    expect(result?.expiresAt).toBeDefined();
  });

  it("reports cloud connection requirement when redeeming in offline mode", async () => {
    const result = await PartnerService.redeemPartnerCode("4829");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Cloud connection required");
  });

  it("handles unlinking cleanly", async () => {
    const unlinkRes = await PartnerService.unlinkPartner();
    expect(unlinkRes).toBe(true);
  });
});

describe("Supabase Sync Service Suite", () => {
  it("provides initial sync state", () => {
    const state = SupabaseSyncService.getSyncState();
    expect(state).toBeDefined();
    expect(["idle", "offline", "syncing", "synced", "error"]).toContain(state.status);
  });

  it("gracefully runs manual sync in offline mode without throwing", async () => {
    const result = await SupabaseSyncService.syncAll();
    expect(result.status).toBe("offline");
  });
});
