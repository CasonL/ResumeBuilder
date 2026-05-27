import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { encryptData, decryptData, getEncryptionKey } from '@/lib/encryption';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { data: profileRecord, error } = await supabase
      .from('profiles')
      .select('encrypted_data')
      .eq('user_id', user.id)
      .single();

    // If no profile exists, return empty structure
    if (error || !profileRecord) {
      return NextResponse.json({
        personalInfo: {},
        education: {},
        experiences: [],
        leadership: [],
        projects: [],
        skills: [],
        certifications: [],
        achievements: [],
        hobbies: []
      });
    }

    // Decrypt and return profile data
    const encryptionKey = getEncryptionKey();
    const profileData = decryptData(profileRecord.encrypted_data, encryptionKey);
    
    return NextResponse.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
