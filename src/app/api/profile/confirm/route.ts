import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { encryptData, getEncryptionKey } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const profileData = await request.json();
    
    // Encrypt profile data
    const encryptionKey = getEncryptionKey();
    const encryptedData = encryptData(profileData, encryptionKey);

    const supabase = await createClient();
    
    // Upsert profile (insert or update)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        encrypted_data: encryptedData,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving profile:', error);
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}
