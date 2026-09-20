# Traki: Gamified Financial Tracker (16-Bit JRPG Edition)

Traki is a gamified personal finance tracker where **consistency and the habit of logging** drive character progression, boss battles, and real-world savings goal unlocks. Every transaction deals damage to active bosses, rewarding disciplined financial mindfulness without penalizing expenses or incentivizing unnecessary spending.

---

## 1. System Architecture & Decisions

```
+-----------------------------------------------------------------------------------+
|                                 TRAKI MOBILE APP                                  |
|                 (React Native + Expo SDK 52 + Expo Router + NativeWind)           |
+-----------------------------------------------------------------------------------+
|  [iOS Back Tap / Deeplink] -> traki://quick-log                                   |
|                                                                                   |
|  [UI LAYER]                                                                       |
|   +-- JRPG Combat Stage (16-bit pixel sprites, slash VFX, floating combat dmg)   |
|   +-- 3-Second Quick-Log Sheet (Wallets, Categories, Amount, Type)               |
|   +-- Savings Vault & Goals (TRK Token Unlock Mechanism)                          |
|   +-- Item Shop & Inventory (Streak Shields, Gold, Potions, Cosmetics)           |
|   +-- Analytics & Ledger (Transaction history, Category spending limits)         |
+-----------------------------------------------------------------------------------+
|  [GAME & BUSINESS ENGINE]                                                         |
|   +-- Combat Engine (Damage calc, Streak Multiplier, Cleave to Weekly/Monthly)    |
|   +-- Economy Engine (EXP curves, Gold drops, TRK token milestone distributions)  |
|   +-- Cycle & Reset Daemon (Daily mob reset, Weekly miniboss, Monthly titan)      |
+-----------------------------------------------------------------------------------+
|  [OFFLINE-FIRST DATA LAYER]                                                       |
|   +-- Expo SQLite (0ms latency, local ACID transactions)                          |
|   +-- Sync Queue & Cloud Gateway (Prepared for Supabase PostgreSQL sync)         |
+-----------------------------------------------------------------------------------+
```

### Core Design Decisions Summary
1. **Combat Loop**:
   - **Log-Driven Strikes**: Each valid transaction entry strikes the active Daily Mob.
   - **Anti-Spam & Streak Multipliers**: Damage scales with daily streaks (e.g. 1.0x -> 1.5x -> 2.0x -> 3.0x Crit). Daily attack damage is balanced so 2-5 regular daily logs conquer the daily mob.
   - **Cleave System**: 100% of damage hits the **Daily Mob**, 35% cleaves into the **Weekly Miniboss**, and 15% cleaves into the **Monthly Titan**. Every single log makes visible progress on all 3 tiers.

2. **Dual-Currency In-Game Economy**:
   - **TRK Tokens**: High-value milestone currency earned by conquering Weekly Minibosses, Monthly Titans, and hitting perfect streak milestones. Used to **Unlock Real-World Savings Goals** (e.g., concert tickets, new gadgets) once target savings are reached.
   - **In-Game Gold**: Earned from daily mob defeats and quest completions. Used in the Item Shop to buy **Streak Shields** (prevents streak reset on missed days), potion buffs (temporary damage boost), and avatar cosmetics.
   - **EXP & Levels**: Level up the Hero, unlocking higher base attack power, passive crit chance, and retro sound/sprite packs.

3. **Stakes & Failure System**:
   - **Forgiving Stakes**: If a boss timer expires before defeat, it escapes without dropping loot or EXP.
   - Missed days break the streak unless protected by an active **Streak Shield**. No harsh character death or penalty on real-world balances.

4. **Apple iOS Back Tap Integration**:
   - URL Scheme & Deeplink: `traki://quick-log` opens directly into a 3-second rapid transaction modal.
   - Configurable iOS Shortcut instructions provided for users to bind to iPhone's **Settings > Accessibility > Touch > Back Tap** (Double Tap or Triple Tap).

---

## 2. Database Schema (Expo SQLite)

```sql
-- Transactions Ledger
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),
  category_id TEXT NOT NULL,
  wallet_id TEXT NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL, -- Unix timestamp (ms)
  is_synced INTEGER DEFAULT 0
);

-- Wallets / Accounts
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'credit_card', 'savings')),
  balance REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  color TEXT
);

-- Categories & Monthly Budgets
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  monthly_budget REAL DEFAULT 0,
  is_income INTEGER DEFAULT 0
);

-- Savings Goals (TRK Token Unlocks)
CREATE TABLE savings_goals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  trk_tokens_required INTEGER NOT NULL,
  is_unlocked INTEGER DEFAULT 0,
  deadline INTEGER,
  created_at INTEGER NOT NULL
);

-- Hero & Player Stats
CREATE TABLE player_profile (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  trk_tokens INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  highest_streak INTEGER DEFAULT 0,
  last_logged_date TEXT, -- YYYY-MM-DD
  streak_shields INTEGER DEFAULT 1
);

-- Boss Encounters State
CREATE TABLE boss_encounters (
  id TEXT PRIMARY KEY,
  tier TEXT NOT NULL CHECK(tier IN ('daily', 'weekly', 'monthly')),
  name TEXT NOT NULL,
  sprite_key TEXT NOT NULL,
  max_hp INTEGER NOT NULL,
  current_hp INTEGER NOT NULL,
  exp_reward INTEGER NOT NULL,
  gold_reward INTEGER NOT NULL,
  trk_reward INTEGER NOT NULL,
  starts_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  is_defeated INTEGER DEFAULT 0
);
```

---

## 3. Proposed Project Structure

```
traki/
|-- app/                            # Expo Router screens
|   |-- _layout.tsx                 # Root layout with providers & deeplink listener
|   |-- (tabs)/
|   |   |-- index.tsx               # Home: 16-Bit Combat Stage + Quick Status
|   |   |-- tracker.tsx             # Financial Ledger & Category Breakdown
|   |   |-- vault.tsx               # Savings Goals & TRK Token Unlocks
|   |   +-- shop.tsx                # Item Shop (Streak Shields, Cosmetics, Gear)
|   |-- quick-log.tsx               # Modal screen triggered by Back Tap (3-sec log)
|   +-- boss-detail/[id].tsx        # Boss inspection & combat stats modal
|-- src/
|   |-- components/
|   |   |-- combat/                 # 16-bit Stage, Boss Sprite, Slash Animation, Combat Numbers
|   |   |-- tracker/                # Transaction Item, Wallet Card, Budget Progress
|   |   |-- vault/                  # Goal Progress Card, TRK Socketing Animation
|   |   +-- ui/                     # Pixel buttons, Retro modal frames, Pixel fonts
|   |-- services/
|   |   |-- db.ts                   # Expo SQLite initialization, migrations, seeds
|   |   |-- combatEngine.ts         # Damage, Cleave, Streak calculations, Encounter lifecycle
|   |   |-- economyService.ts       # Gold, TRK Token awards, Goal unlock validation
|   |   |-- transactionService.ts   # CRUD operations for finances & wallets
|   |   +-- soundService.ts         # Retro 8/16-bit audio triggers (hit, crit, level-up)
|   |-- hooks/                      # useCombat, usePlayerStats, useTransactions, useVault
|   +-- constants/                  # Boss definitions, Monster sprites, Category presets
|-- package.json
|-- app.json                        # Scheme: "traki", orientation, splash, plugins
|-- tailwind.config.js
+-- tsconfig.json
```

---

## 4. Phase 1 Implementation Plan

### Step 1: Project Scaffolding
- Initialize Expo project with TypeScript, Expo Router, NativeWind/Tailwind CSS, and Lucide Icons.
- Configure deep-linking scheme (`traki://`) in `app.json`.
- Install dependencies: `expo-sqlite`, `react-native-reanimated`, `expo-haptics`, `expo-linking`.

### Step 2: Database Layer & State Management
- Initialize SQLite schema with migrations and default seeds (Wallets, default Categories, starter Daily Mob, starter Weekly Miniboss, starter Monthly Titan).
- Implement database access services with clean async interfaces.

### Step 3: Combat Engine & 16-Bit Visual Stage
- Build the **Combat Stage Component**:
  - Animated pixel art character & active boss sprite.
  - Interactive multi-tier display: Tab or slider toggling between Daily Mob, Weekly Miniboss, and Monthly Titan.
  - Floating combat text (+50 DMG, CRITICAL HIT!) and slashing particle animation on log.
  - Health bars with retro borders and percentage indicators.

### Step 4: Rapid 3-Second Quick-Log Experience
- Build the `quick-log` screen:
  - Big numeric pad, quick category selectors with 1-tap presets, and wallet toggles.
  - Haptic feedback upon submission.
  - Immediate trigger into Combat Engine to calculate strike damage and update boss HP.

### Step 5: Savings Vault & TRK Token Economy
- Goal creation modal (Target $ + TRK token cost requirement).
- Real-world savings transfer logger (adds to goal balance).
- Goal Unlock Ceremony: Celebration screen when $ target and TRK tokens are fulfilled.

### Step 6: Item Shop & Streak Management
- In-game Shop interface: Purchase Streak Shields with Gold, view active inventory.
- Daily reset check: Verifies if user logged yesterday; consumes Streak Shield if missed, or updates streak counter.

### Step 7: iOS Shortcut Integration Guide
- Pre-built iOS Shortcut workflow with deep-link URL schema documentation for setting up Double/Triple Back Tap.

---

## 5. Verification Plan

### Automated & Static Verification
- Run TypeScript compile check: `npx tsc --noEmit`
- Verify database migrations execute cleanly without syntax errors in local SQLite environment.
- Unit test combat calculations:
  - Verify 100% daily, 35% weekly, 15% monthly cleave distribution.
  - Verify streak multiplier scaling (Day 1: 1.0x, Day 3: 1.25x, Day 7: 1.5x, etc.).
  - Verify anti-spam diminishing returns per day.

### Manual Verification
- Test `traki://quick-log` deeplink triggering on iOS simulator / mobile browser.
- Perform test transaction logs:
  - Observe slash animation, floating combat damage, and boss health bar reduction.
  - Verify Daily Mob defeat drops Gold and EXP.
  - Verify Weekly/Monthly boss defeat drops TRK Tokens.
- Test Goal creation and unlock with sufficient TRK tokens.
- Test Item Shop purchase of Streak Shield using earned in-game Gold.
