import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const savedResumesDir = path.join(process.cwd(), 'src', 'data', 'saved-resumes');
    const resumePath = path.join(savedResumesDir, `${id}.json`);
    
    if (!fs.existsSync(resumePath)) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }
    
    const resumeData = fs.readFileSync(resumePath, 'utf-8');
    const parsed = JSON.parse(resumeData);
    
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error loading resume:', error);
    return NextResponse.json(
      { error: 'Failed to load resume' },
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
    const body = await request.json();
    const { data, masterData } = body;
    
    const savedResumesDir = path.join(process.cwd(), 'src', 'data', 'saved-resumes');
    const resumePath = path.join(savedResumesDir, `${id}.json`);
    
    if (!fs.existsSync(resumePath)) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }
    
    const updatedResume = {
      data,
      masterData
    };
    
    fs.writeFileSync(resumePath, JSON.stringify(updatedResume, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving resume:', error);
    return NextResponse.json(
      { error: 'Failed to save resume' },
      { status: 500 }
    );
  }
}
