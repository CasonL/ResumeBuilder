import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers';
import { addCredits } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    await requireAdmin();

    const { userId, amount } = await request.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid userId or amount' },
        { status: 400 }
      );
    }

    const result = await addCredits(
      userId,
      amount,
      'admin_grant',
      `Admin granted ${amount} credits`
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to add credits' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding credits:', error);
    return NextResponse.json(
      { error: 'Admin privileges required' },
      { status: 403 }
    );
  }
}
