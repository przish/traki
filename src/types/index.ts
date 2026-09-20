export type WalletType = "cash" | "bank" | "credit" | "savings";

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number; // Stored in cents (integer) to prevent floating-point drift
  currency: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  budget_cap: number | null; // In cents
  color: string;
}

export type TransactionType = "expense" | "income" | "transfer";

export interface Transaction {
  id: string;
  amount: number; // In cents
  type: TransactionType;
  category_id: string;
  wallet_id: string;
  note: string;
  created_at: string; // ISO string
  is_synced: number; // 0 or 1
}

export interface PlayerProfile {
  id: string;
  level: number;
  exp: number;
  gold: number;
  trk_tokens: number;
  current_streak: number;
  highest_streak: number;
  streak_shields: number;
  last_logged_date: string | null; // YYYY-MM-DD
  partner_id?: string;
  partner_name?: string;
  partner_streak?: number;
}

export type BossTier = "daily" | "weekly" | "monthly";

export interface BossEncounter {
  id: string;
  tier: BossTier;
  name: string;
  title: string;
  max_hp: number;
  current_hp: number;
  gold_reward: number;
  trk_reward: number;
  exp_reward: number;
  sprite_key: string;
  expires_at: string; // ISO string
  is_defeated: number; // 0 or 1
}

export interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number; // In cents
  current_amount: number; // In cents
  trk_tokens_required: number;
  is_unlocked: number; // 0 or 1
  category: string;
  icon: string;
  tone: string;
}

export interface CombatStrikeResult {
  baseDamage: number;
  isCrit: boolean;
  critMultiplier: number;
  streakMultiplier: number;
  diminishingPenalty: number;
  totalDamage: number;
  dailyCleave: number; // 100%
  weeklyCleave: number; // 35%
  monthlyCleave: number; // 15%
  goldEarned: number;
  expEarned: number;
  defeatedBosses: BossTier[];
}

export type AuthProviderType = "google" | "apple" | "stingray" | "email" | "guest";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  provider: AuthProviderType;
  token?: string;
  createdAt: string;
}

export interface AuthSession {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  provider: AuthProviderType;
  token?: string;
  created_at: string;
}

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

export type PartnerLinkStatus = "pending" | "active" | "expired";

export interface PartnerLink {
  id: string;
  inviter_id: string;
  invitee_id?: string;
  invite_code: string;
  status: PartnerLinkStatus;
  created_at: string;
  expires_at: string;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  pendingCount: number;
  errorMessage?: string;
}
