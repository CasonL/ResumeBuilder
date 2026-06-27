import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { decryptData, encryptData, getEncryptionKey } from '@/lib/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    // Decrypt resume data
    const encryptionKey = getEncryptionKey();
    const resumeData = decryptData(resume.encrypted_data, encryptionKey);

    // Fetch the user's master profile data (required by ResumeGenerated)
    let masterData = null;
    try {
      const { data: profileRecord } = await supabase
        .from('profiles')
        .select('encrypted_data')
        .eq('user_id', user.id)
        .single();

      if (profileRecord?.encrypted_data) {
        masterData = decryptData(profileRecord.encrypted_data, encryptionKey);
      }
    } catch (profileError) {
      console.error('Failed to fetch master profile for resume view:', profileError);
    }

    return NextResponse.json({
      id: resume.id,
      name: resume.name,
      data: resumeData,
      masterData,
      jobDescription: resume.job_description,
      preferences: resume.preferences,
      createdAt: resume.created_at,
      updatedAt: resume.updated_at,
    });
  } catch (error) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data, name } = await request.json();

    // Encrypt updated resume data
    const encryptionKey = getEncryptionKey();
    const encryptedData = encryptData(data, encryptionKey);

    const supabase = await createClient();
    const { error } = await supabase
      .from('resumes')
      .update({
        encrypted_data: encryptedData,
        name: name || undefined,
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating resume:', error);
      return NextResponse.json(
        { error: 'Failed to update resume' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { error: 'Failed to update resume' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting resume:', error);
      return NextResponse.json(
        { error: 'Failed to delete resume' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}
