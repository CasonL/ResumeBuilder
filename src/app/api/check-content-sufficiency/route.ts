import { NextRequest, NextResponse } from 'next/server';
import { estimateContentSufficiency } from '@/lib/ai-content-adjuster';

export async function POST(request: NextRequest) {
  try {
    const { resumeHtml } = await request.json();

    if (!resumeHtml) {
      return NextResponse.json(
        { error: 'Missing resumeHtml parameter' },
        { status: 400 }
      );
    }

    const assessment = await estimateContentSufficiency(resumeHtml);

    return NextResponse.json(assessment);
  } catch (error: any) {
    console.error('Content sufficiency check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assess content' },
      { status: 500 }
    );
  }
}
