import { NextResponse } from 'next/server';
import { getCurrentUser, ensureUserExists } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Ensure user row exists and admin flag is correct
    await ensureUserExists(user.id, user.email || '');

    const supabase = await createClient();
    const { data: userData } = await supabase
      .from('users')
      .select('credits, is_admin')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      email: user.email,
      credits: userData?.credits ?? 0,
      isAdmin: userData?.is_admin ?? false,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
