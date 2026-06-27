-- Migration: Set 3 default credits for new users and mark casonlamothe@gmail.com as admin
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)

-- 1. Update the column default to 3 credits for future rows
ALTER TABLE public.users ALTER COLUMN credits SET DEFAULT 3;

-- 2. Update the trigger function to grant 3 credits and auto-assign admin for owner email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, credits, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    3, -- Give 3 free credits on signup
    (NEW.email = 'casonlamothe@gmail.com') -- Admin for owner account
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Set admin and ensure credits for the owner account (if already exists)
UPDATE public.users
SET is_admin = TRUE
WHERE email = 'casonlamothe@gmail.com';

-- 4. Give 3 credits to any existing users who have 0 credits (never generated)
UPDATE public.users
SET credits = 3
WHERE credits = 0 AND is_admin = FALSE;
