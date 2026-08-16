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
  stripe_session_id TEXT,
  email             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

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
