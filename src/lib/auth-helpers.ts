import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAIL = 'casonlamothe@gmail.com';
const DEFAULT_CREDITS = 3;

/**
 * Ensure a row exists in public.users for the given auth user.
 * Creates one with 3 credits (and admin flag if applicable) if missing.
 */
export async function ensureUserExists(userId: string, email: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (!existing) {
    await supabase.from('users').insert({
      id: userId,
      email,
      credits: DEFAULT_CREDITS,
      is_admin: email === ADMIN_EMAIL,
    });
  } else if (email === ADMIN_EMAIL) {
    // Always keep admin flag set for the owner account
    await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('id', userId)
      .eq('is_admin', false);
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get the current user's full profile including credits and admin status.
 * Also ensures a users row exists (creates one with 3 credits if missing).
 */
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  // Ensure the users row exists with correct defaults
  await ensureUserExists(user.id, user.email || '');

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return {
    ...user,
    ...profile,
  };
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.is_admin || false;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require admin privileges - throws error if not admin
 */
export async function requireAdmin() {
  const profile = await getCurrentUserProfile();
  if (!profile?.is_admin) {
    throw new Error('Admin privileges required');
  }
  return profile;
}
