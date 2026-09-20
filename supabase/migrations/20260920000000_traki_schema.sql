-- Traki 16-Bit Gamified Financial Tracker
-- Supabase Schema & Row Level Security (RLS) Policies

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  trk_tokens INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 1,
  highest_streak INTEGER DEFAULT 1,
  streak_shields INTEGER DEFAULT 1,
  last_logged_date DATE,
  partner_id UUID REFERENCES auth.users(id),
  partner_name TEXT,
  partner_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit', 'savings')),
  balance BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PHP',
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  budget_cap BIGINT,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transactions Ledger Table (Synced from Offline SQLite)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  category_id TEXT NOT NULL,
  wallet_id TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Savings Goals (Two-Key Unlock Mechanism)
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount BIGINT NOT NULL,
  current_amount BIGINT NOT NULL DEFAULT 0,
  trk_tokens_required INTEGER NOT NULL DEFAULT 0,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  tone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Partner Links (Invite Code Pairing)
CREATE TABLE IF NOT EXISTS public.partner_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 7. Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_links_code ON public.partner_links(invite_code);
CREATE INDEX IF NOT EXISTS idx_partner_links_inviter ON public.partner_links(inviter_id);

-- 8. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_links ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own wallets" ON public.wallets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own savings goals" ON public.savings_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own partner links" ON public.partner_links
  FOR ALL USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- 10. Allow reading pending partner links by invite code (for redemption)
CREATE POLICY "Anyone can read pending partner links by code" ON public.partner_links
  FOR SELECT USING (status = 'pending' AND expires_at > NOW());
