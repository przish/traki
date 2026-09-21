-- ============================================================
-- TRAKI SUPABASE DATA CLEANUP QUERIES (REVISED)
-- Version: 1.1 | Email & Username Target Resolution
-- ============================================================

-- ============================================================
-- SECTION 1: ROUTINE MAINTENANCE (Safe to run anytime)
-- ============================================================

-- 1A. Purge expired partner invite links
DELETE FROM public.partner_links
WHERE expires_at < NOW()
  AND status = 'pending';

-- 1B. Mark long-stale invites as expired
UPDATE public.partner_links
SET status = 'expired'
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '48 hours';

-- 1C. Clean orphaned records (where auth user no longer exists)
DELETE FROM public.wallets WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.categories WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.transactions WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.savings_goals WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);


-- ============================================================
-- SECTION 2: PER-USER RESET (Target by Email or Username)
-- ============================================================
-- Set ONE of the variables below to identify the user.
-- ============================================================

DO $$
DECLARE
  v_target_email TEXT := 'irishmaypureza@gmail.com'; -- Set target email
  v_target_user_id UUID;
BEGIN
  -- Resolve UUID from auth.users
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE email = v_target_email;

  IF v_target_user_id IS NULL THEN
    RAISE NOTICE 'No user found with email: %', v_target_email;
    RETURN;
  END IF;

  -- 2A. Cancel partner links & uncouple partners
  DELETE FROM public.partner_links
  WHERE inviter_id = v_target_user_id OR invitee_id = v_target_user_id;

  UPDATE public.profiles
  SET partner_id = NULL, partner_name = NULL, partner_streak = 0
  WHERE partner_id = v_target_user_id;

  -- 2B. Clear user financial data
  DELETE FROM public.transactions WHERE user_id = v_target_user_id;
  DELETE FROM public.savings_goals WHERE user_id = v_target_user_id;
  DELETE FROM public.wallets WHERE user_id = v_target_user_id;
  DELETE FROM public.categories WHERE user_id = v_target_user_id;

  -- 2C. Reset gamified stats on the profile
  UPDATE public.profiles
  SET
    level             = 1,
    exp               = 0,
    gold              = 0,
    trk_tokens        = 0,
    current_streak    = 1,
    highest_streak    = 1,
    streak_shields    = 1,
    last_logged_date  = NULL,
    partner_id        = NULL,
    partner_name      = NULL,
    partner_streak    = 0,
    updated_at        = NOW()
  WHERE id = v_target_user_id;

  RAISE NOTICE 'Successfully reset data for user: % (%)', v_target_email, v_target_user_id;
END $$;


-- ============================================================
-- SECTION 3: WIPE ALL TEST DATA (Keeps Auth Accounts & Profiles)
-- ============================================================
-- Resets game stats and clears all financial records across ALL accounts
-- without needing individual IDs.
-- ============================================================

-- 3A. Clear all app transactional data
DELETE FROM public.partner_links;
DELETE FROM public.savings_goals;
DELETE FROM public.transactions;
DELETE FROM public.categories;
DELETE FROM public.wallets;

-- 3B. Reset all profile stats back to Level 1 baseline
UPDATE public.profiles
SET
  level             = 1,
  exp               = 0,
  gold              = 0,
  trk_tokens        = 0,
  current_streak    = 1,
  highest_streak    = 1,
  streak_shields    = 1,
  last_logged_date  = NULL,
  partner_id        = NULL,
  partner_name      = NULL,
  partner_streak    = 0,
  updated_at        = NOW();