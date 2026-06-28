import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { encryptData, decryptData, getEncryptionKey } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const patch = await request.json();
    const encryptionKey = getEncryptionKey();
    const supabase = await createClient();

    const { data: profileRecord } = await supabase
      .from('profiles')
      .select('encrypted_data')
      .eq('user_id', user.id)
      .single();

    const existing = profileRecord?.encrypted_data
      ? decryptData(profileRecord.encrypted_data, encryptionKey)
      : {};

    const merged = { ...existing, ...patch };

    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, encrypted_data: encryptData(merged, encryptionKey) }, { onConflict: 'user_id' });

    if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
