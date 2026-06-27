import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { deductCredits, hasCredits } from '@/lib/credits';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const enough = await hasCredits(user.id, 1);
  if (!enough) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
  }

  const result = await deductCredits(
    user.id,
    1,
    'chat_unlock',
    'Unlocked 10 more chat messages for resume ' + id,
    id
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Failed to deduct credit' }, { status: 500 });
  }

  return NextResponse.json({ success: true, extraMessages: 10 });
}
