import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    
    const { id: resumeId } = await params;

    const savedResumePath = path.join(
      process.cwd(),
      'src',
      'data',
      'saved-resumes',
      `${resumeId}.json`
    );

    const previewImagePath = path.join(
      process.cwd(),
      'public',
      'previews',
      `${resumeId}.png`
    );

    let deleted = false;

    if (fs.existsSync(savedResumePath)) {
      fs.unlinkSync(savedResumePath);
      deleted = true;
    }

    if (fs.existsSync(previewImagePath)) {
      fs.unlinkSync(previewImagePath);
    }

    if (!deleted) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
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
