# Traki Design System (`design.md`)

*Author: `frontend-agent` | Specification for Traki (16-Bit Gamified Financial Tracker)*

---

## 1. Design Philosophy

**The Fusion of 16-Bit Pixel Fantasy with Calm Financial Architecture**

Traki unites the nostalgia, visceral reward loops, and sensory delight of classic 16-bit JRPG combat with the emotional clarity, reassurance, and restraint required for personal wealth building:

1. **Visceral Combat & Instant Gratification:** Every logged transaction is an attack strike. Combat features floating damage numbers (`-125 DMG`, `CRIT! 250`), dynamic boss health bars, and pixel badge rewards.
2. **Calm Financial Architecture:** Routine spending is normal life, not a catastrophe. Financial tracking views eliminate alarmist layouts, clutter, and sensory fatigue.
3. **Co-op Momentum:** Turning daily habits into shared progress through streaks, bounties, and collective victories.

---

## 2. Color Tokens & Anti-Panic Palette

### Core Brand Tokens (from Manus UI/UX Design)
| Token | Light Mode Hex | Dark Mode Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas / Background** | `#FAF8F6` (Warm linen) | `#101112` (Deep charcoal) | Root container background |
| **Surface / Paper** | `#FFFFFF` | `#1B1D1F` | Content cards, bottom sheets, modals |
| **Foreground / Ink** | `#171717` (Soft black) | `#F7F4F1` (Warm off-white) | High-contrast headers and values |
| **Muted** | `#8B8988` | `#AAA7A5` | Subtitles, labels, timestamps |
| **Border / Line** | `#E7E1DE` | `#303336` | Card outlines, dividers |
| **Primary Accent** | `#D92C3B` (Crimson) | `#F07178` (Coral flame) | Combat buttons, boss alerts, key CTAs |
| **Gold / Currency** | `#F1B64A` | `#F6CA78` | In-game Gold, streaks, bounties |
| **Lavender / TRK** | `#E8E4F2` | `#322B45` | TRK Token badges, Vault goals |
| **Success / Heal** | `#3C9B55` | `#78C98B` | Positive cash flow, completed missions |
| **Peach / Soft Red** | `#F4D5CB` | `#3D2723` | Subtle combat damage tags, category chips |

### Anti-Panic Rules
- **Never style routine expenses in alarming red.** Routine expenses use neutral `#171717` or subtle slate/peach tones.
- **Red (`#D92C3B`) is strictly reserved for:**
  - Boss HP damage counters and combat strike impact tags.
  - Critical budget overruns (> 100% threshold breach).
  - Destructive account actions.

---

## 3. Typography Hierarchy & Numeric Formatting

### Font Selection
- **Display & Pixel Fantasy:** Retro monospace / rounded headers (`SF Pro Rounded`, `Courier New`, `ui-monospace`) for Boss Names, Combat Logs, EXP counters, and Streaks.
- **Financial Body:** Clean, accessible system sans-serif (`-apple-system`, `system-ui`, `Inter`, `Roboto`) for effortless legibility.

### Strict Rule: Tabular Numbers (`tabular-nums`)
All financial currency values (balances, transaction line items, budget comparisons) **must** utilize `fontVariant: ['tabular-nums']` (or `tabular-nums` Tailwind utility) to prevent jitter during updates and ensure vertical column alignment:
```tsx
<Text className="tabular-nums font-semibold text-lg text-ink">
  PHP {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
</Text>
```

---

## 4. Component Specifications

### A. Boss Combat Stage Card
- **Boss Header:** Pixel boss name, tier indicator (Daily Mob / Weekly Miniboss / Monthly Titan), and remaining timer countdown.
- **Health Bar:** Dual-layer health gauge (background track, active HP bar with smooth tweening, and trailing hit flash).
- **Floating Combat Text (FCT):** Reanimated floating damage numbers (`+75`, `CRIT! 150`) that translate vertically and fade over 650ms.

### B. 3-Second Quick-Log Sheet (`traki://quick-log`)
- **Direct Entry:** Opens instantly with focused numeric keypad.
- **1-Tap Category & Wallet Selectors:** Compact horizontal chip scrollers.
- **Immediate Combat Strike:** Tapping "Strike & Save" completes the entry in under 3 taps, plays haptic feedback, triggers the slash VFX, and records the transaction.

### C. Financial Ledger (Tracker)
- **Multi-Wallet Cards:** Clean card carousel (Cash, Bank, Credit Card, Savings) with discrete balance totals.
- **Transaction Item:** Category icon badge, merchant/note, transaction time, and aligned tabular amount.

### D. Savings Vault & Bounty Board
- **Two-Key Goal Cards:** Displays progress towards target amount (PHP) alongside required TRK tokens.
- **Dual Unlock State:** Locked until `current_amount >= target_amount` AND `user_trk_tokens >= required_trk_tokens`.

### E. In-Game Item Shop
- **Shop Slots:** Streak Shields, HP Potions, Combat Multiplier Charms.
- **Currency:** Purchases made with earned in-game Gold (never real money).

---

## 5. Theme Parity (Light & Dark Mode)

| Element | Light Mode (`#FAF8F6`) | Dark Mode (`#101112`) |
| :--- | :--- | :--- |
| Card Surface | `#FFFFFF` with `#E7E1DE` border | `#1B1D1F` with `#303336` border |
| Primary Text | `#171717` (High contrast WCAG AAA) | `#F7F4F1` (WCAG AAA) |
| Health Bar Track | `#E7E1DE` | `#303336` |
| Active Health Fill | `#D92C3B` | `#F07178` |
| Gold Coin Tag | `#FFF1D7` bg, `#A87610` text | `#382B14` bg, `#F6CA78` text |

---

## 6. Manus UI/UX Ingestion Protocol

Whenever new screens or components are exported from Manus:
1. Strip external server/database bindings (e.g. Express, tRPC, MySQL).
2. Bind UI to Traki's reactive local hooks:
   - `useTransactions` & `useWallets` (Fintech ledger)
   - `useCombat` (Combat stage, bosses, damage calculations)
   - `useVault` & `useEconomy` (Savings goals, TRK tokens, Gold)
3. Maintain zero ESLint and zero TypeScript errors (`npx tsc --noEmit`).
