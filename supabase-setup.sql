-- ============================================================
-- Anazk AI - Supabase Database Setup (Safe / Idempotent)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cnisrikrxwcnsjeuogwr/sql/new
-- ============================================================

-- 1. Create the profiles table to store user data on signup
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Safely create profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Auto-update updated_at timestamp function & trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Create the licenses table to store generated License Keys & activation duration
CREATE TABLE IF NOT EXISTS public.licenses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key               TEXT UNIQUE NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 60,
  status            TEXT NOT NULL DEFAULT 'unused', -- 'unused', 'active', 'expired'
  activated_at      TIMESTAMPTZ,
  device_id         TEXT, -- Unique machine/device lock identifier
  stripe_session_id TEXT,
  email             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure device_id column exists if table is already created
ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS device_id TEXT;

-- 6. Enable RLS on licenses
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- 7. Safely create policies for licenses
DROP POLICY IF EXISTS "Allow public select on licenses" ON public.licenses;
CREATE POLICY "Allow public select on licenses"
  ON public.licenses FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public update on licenses for activation" ON public.licenses;
CREATE POLICY "Allow public update on licenses for activation"
  ON public.licenses FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access" ON public.licenses;
CREATE POLICY "Allow service role full access"
  ON public.licenses FOR ALL
  USING (true);


-- 8. Email Login & Credits Sync Table Modifications (Run this in Supabase SQL editor)
-- Add credits_minutes to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits_minutes INTEGER DEFAULT 0;

-- Create pending_credits table for pre-registration checkout
CREATE TABLE IF NOT EXISTS public.pending_credits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  credits_minutes INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on pending_credits
ALTER TABLE public.pending_credits ENABLE ROW LEVEL SECURITY;

-- Allow service role full access to pending_credits
DROP POLICY IF EXISTS "Service role full access pending_credits" ON public.pending_credits;
CREATE POLICY "Service role full access pending_credits"
  ON public.pending_credits FOR ALL
  USING (true);

-- Trigger to automatically transfer pending credits when user signs up
CREATE OR REPLACE FUNCTION public.transfer_pending_credits()
RETURNS TRIGGER AS $$
DECLARE
  pending_mins INTEGER;
BEGIN
  -- Check if there are pending credits for the signing-up email
  SELECT credits_minutes INTO pending_mins
  FROM public.pending_credits
  WHERE email = NEW.email;

  IF FOUND AND pending_mins > 0 THEN
    -- Transfer credits to profiles
    NEW.credits_minutes = COALESCE(NEW.credits_minutes, 0) + pending_mins;
    -- Clean up from pending_credits
    DELETE FROM public.pending_credits WHERE email = NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger on profiles insert
DROP TRIGGER IF EXISTS on_profile_created_transfer_credits ON public.profiles;
CREATE TRIGGER on_profile_created_transfer_credits
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.transfer_pending_credits();

