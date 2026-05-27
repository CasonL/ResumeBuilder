import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';

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
    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('id, name, created_at, updated_at, job_description')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resumes:', error);
      return NextResponse.json({ resumes: [] });
    }

    // Format resumes for frontend
    const formattedResumes = (resumes || []).map(resume => ({
      id: resume.id,
      name: resume.name,
      variant: 'generated',
      createdAt: new Date(resume.created_at).toISOString().split('T')[0],
      updatedAt: new Date(resume.updated_at).toISOString().split('T')[0],
    }));

    return NextResponse.json({ resumes: formattedResumes });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json({ resumes: [] });
  }
}
