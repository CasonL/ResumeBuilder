-- Migration: Create profiles, resumes, and credit_transactions tables
-- Run this in Supabase Dashboard > SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at helper function if missing
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  encrypted_data TEXT NOT NULL,
  encryption_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  job_description TEXT,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  description TEXT,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at DESC);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they already exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON public.resumes;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON public.credit_transactions;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Resumes policies
CREATE POLICY "Users can view own resumes"
  ON public.resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
  ON public.resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON public.resumes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON public.resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Credit transactions policies
CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (true);

-- updated_at triggers
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_resumes ON public.resumes;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_resumes
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
