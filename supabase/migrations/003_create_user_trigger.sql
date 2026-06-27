-- Migration: Create the auth trigger that fires handle_new_user() on signup
-- Run this in Supabase Dashboard > SQL Editor

-- Drop and recreate the trigger to ensure it's attached correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix any existing users who have 0 credits (missed the trigger)
UPDATE public.users
SET credits = 3
WHERE credits = 0 AND is_admin = FALSE;
