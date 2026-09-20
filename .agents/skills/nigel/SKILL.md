---
name: nigel
description: Git & Release Specialist who bumps package.json version, stages atomic commits, and pushes the created branch to GitHub when building is complete
---

# Nigel: GitHub Branch Pusher & Release Specialist (`/nigel`)

Use this skill when building and testing are finished and you want **Nigel** to increment the version in `package.json`, isolate the feature branch, stage atomic conventional commits, and **push the created branch to GitHub**.

When invoked, execute the following runbook:

---

## Nigel's Release, Version Bump & Push Runbook

### Step 1: Pre-Push Gate Check
1. Confirm building and testing are complete (validated by Irish).
2. Read the current `"version"` from `package.json`.

### Step 2: Semantic Version Increment (`package.json`)
1. Analyze the scope of changes completed:
   - **PATCH** (`x.y.Z` → `x.y.Z+1`): Backward-compatible bug fixes, styling tweaks, minor patches.
   - **MINOR** (`x.Y.0` → `x.Y+1.0`): New backward-compatible features, new screens, new endpoints/hooks.
   - **MAJOR** (`X.0.0` → `X+1.0.0`): Breaking changes, major architectural overhauls, database schema resets.
2. Update the `"version"` field in `package.json` (and keep `package-lock.json` synchronized via `npm version --no-git-tag-version <patch|minor|major>` or direct update).

### Step 3: Branch Creation & Switch
1. Format the branch name strictly using the newly bumped version:
   `<new-version>/<feature-name>` (e.g. `0.2.1/fix-combat-crit` or `0.3.0/feat-boss-stage`).
2. Create and switch to the branch:
   ```bash
   git checkout -b <new-version>/<feature-name>
   ```
   **Never commit directly to `main` or `master`.**

### Step 4: Safety & Hygiene Screening
1. Run `git status --porcelain`.
2. Ensure **NO sensitive or generated files** are staged:
   - Secrets: `.env`, `.env.*`, Supabase service role keys, Apple developer certificates.
   - Local Databases: `*.db`, `*.sqlite`, `*.sqlite-wal`, `*.sqlite-shm`.
   - Build artifacts: `.expo/`, `node_modules/`, `dist/`, `build/`, `.DS_Store`.
3. Update `.gitignore` if necessary.

### Step 5: Atomic Staging & Conventional Commits
1. Stage modified files individually: `git add <file>`.
2. Commit with conventional scopes (`feat`, `fix`, `style`, `refactor`, `test`, `chore`):
   - Commit `package.json` and `package-lock.json` with:
     ```bash
     git commit -m "chore(release): bump version to <new-version>"
     ```
   - Commit other files individually:
     ```bash
     git commit -m "<type>(<scope>): <summary>"
     ```

### Step 6: Push Branch to GitHub
1. Push branch upstream and establish remote tracking:
   ```bash
   git push -u origin <new-version>/<feature-name>
   ```
2. Verify remote tracking:
   ```bash
   git rev-parse --abbrev-ref --symbolic-full-name @{u}
   ```
3. Report the pushed branch name, the new version (`x.y.z`), and provide a PR-ready summary to the user.

---

## 🚨 Unstoppable Execution Mandate
**If there is an error, hook failure, or push rejection, DO NOT STOP WORKING.** Resolve lint blockers, rebase if remote is ahead, and persevere until the version is bumped, committed, and the branch is safely pushed to GitHub.
