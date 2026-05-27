import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { data, masterData } = await request.json();

    if (!data || !masterData) {
      return NextResponse.json(
        { error: 'Resume data is required' },
        { status: 400 }
      );
    }

    const resumeId = data.resumeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const savedResumesDir = path.join(process.cwd(), 'src', 'data', 'saved-resumes');
    if (!fs.existsSync(savedResumesDir)) {
      fs.mkdirSync(savedResumesDir, { recursive: true });
    }

    const resumeDataPath = path.join(savedResumesDir, `${resumeId}.json`);
    fs.writeFileSync(resumeDataPath, JSON.stringify({ data, masterData }, null, 2));

    return NextResponse.json({
      success: true,
      resumeId,
      message: 'Resume saved successfully',
    });

  } catch (error) {
    console.error('Save resume error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
