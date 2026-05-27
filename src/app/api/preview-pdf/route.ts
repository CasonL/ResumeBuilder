import { NextRequest, NextResponse } from 'next/server';
import { renderResumeToPDF } from '@/lib/pdf-utils';

export async function POST(request: NextRequest) {
  try {
    const { resumeHtml } = await request.json();

    if (!resumeHtml) {
      return NextResponse.json(
        { error: 'Missing resumeHtml parameter' },
        { status: 400 }
      );
    }

    const pdfBuffer = await renderResumeToPDF(resumeHtml);

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="resume-preview.pdf"',
      },
    });
  } catch (error: any) {
    console.error('PDF preview error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF preview' },
      { status: 500 }
    );
  }
}
