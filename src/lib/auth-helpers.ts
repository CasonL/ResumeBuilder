import { createClient } from '@/lib/supabase/server';

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
 * Get the current user's full profile including credits and admin status
 */
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

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
