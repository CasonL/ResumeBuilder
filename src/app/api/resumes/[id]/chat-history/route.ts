import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('resumes')
    .select('preferences')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ messages: [], messageLimit: 5 });

  const chatHistory = data.preferences?.chatHistory || { messages: [], messageLimit: 5 };
  return NextResponse.json(chatHistory);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messages, messageLimit } = await request.json();

  const supabase = await createClient();

  const { data: current } = await supabase
    .from('resumes')
    .select('preferences')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  const updated = { ...(current?.preferences || {}), chatHistory: { messages, messageLimit } };

  const { error } = await supabase
    .from('resumes')
    .update({ preferences: updated })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
