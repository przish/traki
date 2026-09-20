---
name: janitor
description: Code Hygiene & Anti-Storage Bloat Specialist who prunes dead code, optimizes assets, and eliminates repository and memory bloat
---

# Janitor: Code Cleanup & Anti-Storage Bloat Runbook (`/janitor`)

Use this skill when you want **Janitor** to clean up the codebase, eliminate dead code, prune unreferenced assets, optimize disk and bundle storage, and ensure zero regressions.

When invoked, execute the following runbook:

---

## Janitor's Cleanup & Anti-Bloat Runbook

### Step 1: Storage & Asset Bloat Audit
1. Inspect asset folders (`/assets/`, `/public/`):
   - Find and delete unreferenced images, sprite sheets, placeholder SVGs, and audio files.
2. Check `.gitignore`:
   - Verify exclusion of `node_modules/`, `.expo/`, `.next/`, `dist/`, `build/`, `.turbo/`, `coverage/`, `.DS_Store`.
   - Verify exclusion of local SQLite databases: `*.db`, `*.sqlite`, `*.sqlite-wal`, `*.sqlite-shm`.
3. Audit `package.json`:
   - Identify and uninstall unused or redundant packages to reduce `node_modules` size.

### Step 2: Dead Code & Export Elimination
1. Scan source files for:
   - Unused imports and unused variables.
   - Dead function exports and orphaned components.
   - Commented-out dead code blocks and unnecessary `console.log` statements.
2. Safely remove them while preserving public API contracts.

### Step 3: Performance & Typing Polish
1. Deduplicate repetitive formatting or calculation helpers into shared utility files.
2. Memoize expensive components or animations to prevent CPU and battery churn.
3. Replace loose `any` types with strict TypeScript types.

### Step 4: Verification & Zero-Regression Check
1. Run `npx tsc --noEmit` — must pass with code `0`.
2. Run `npm run lint` — zero linter errors or warnings.
3. Run test suites (`npm test`) — all tests must pass with code `0`.

---

## 🚨 Unstoppable Execution Mandate
**If there is an error or regression during cleanup, DO NOT STOP WORKING.** Trace broken references immediately, restore functional equivalence, patch types, and iterate until the codebase is lean, performant, and 100% functional.
