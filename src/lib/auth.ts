/**
 * Legacy auth.ts - Now wraps Supabase Auth for backward compatibility
 * Use @/lib/auth-helpers for new code
 */

import { createClient } from '@/lib/supabase/server';

interface Session {
  userId: string;
  email: string;
}

/**
 * @deprecated Use Supabase Auth directly via client
 */
export async function signup(email: string, password: string): Promise<{ success: boolean; error?: string; userId?: string }> {
  console.warn('auth.signup is deprecated - use Supabase Auth directly');
  return { success: false, error: 'Use Supabase Auth directly' };
}

/**
 * @deprecated Use Supabase Auth directly via client
 */
export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; session?: Session }> {
  console.warn('auth.login is deprecated - use Supabase Auth directly');
  return { success: false, error: 'Use Supabase Auth directly' };
}

/**
 * @deprecated Sessions are handled by Supabase
 */
export async function setSessionCookie(session: Session) {
  console.warn('setSessionCookie is deprecated - Supabase handles sessions');
}

/**
 * Get current session - wraps Supabase auth
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return {
    userId: user.id,
    email: user.email || '',
  };
}

/**
 * @deprecated Use Supabase signOut
 */
export async function clearSession() {
  console.warn('clearSession is deprecated - use Supabase signOut');
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session;
}
