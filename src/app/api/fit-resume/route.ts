import { NextRequest, NextResponse } from 'next/server';
import { measureResumePDF } from '@/lib/pdf-utils';
import { adjustResumeStyles } from '@/lib/style-adjuster';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { resumeHtml, targetPages, maxIterations = 5, layoutMode = 'normal' } = await request.json();

    if (!resumeHtml || !targetPages || (targetPages !== 1 && targetPages !== 2)) {
      return NextResponse.json(
        { error: 'Invalid parameters. Provide resumeHtml and targetPages (1 or 2)' },
        { status: 400 }
      );
    }

    let currentHtml = resumeHtml;
    let iteration = 0;
    const adjustmentHistory: any[] = [];

    while (iteration < maxIterations) {
      iteration++;

      const measurement = await measureResumePDF(currentHtml);
      
      adjustmentHistory.push({
        iteration,
        pageCount: measurement.pageCount,
        contentHeight: measurement.contentHeight,
        overflow: measurement.overflow,
      });

      if (measurement.pageCount === targetPages && !measurement.overflow) {
        return NextResponse.json({
          success: true,
          finalHtml: currentHtml,
          iterations: iteration,
          pageCount: measurement.pageCount,
          adjustmentHistory,
          message: `Resume perfectly fits ${targetPages} page(s)`,
        });
      }

      if (iteration >= maxIterations) {
        break;
      }

      const adjusted = adjustResumeStyles(
        currentHtml,
        measurement,
        targetPages,
        layoutMode as 'compressed' | 'normal' | 'spacious'
      );

      // If adjustment returns null, content is insufficient for target pages
      if (adjusted === null) {
        return NextResponse.json({
          success: false,
          finalHtml: currentHtml,
          iterations: iteration,
          adjustmentHistory,
          message: `Insufficient content for ${targetPages} page(s). Resume is only ${measurement.pageCount} page(s) and cannot be stretched further without looking unprofessional.`,
          insufficientContent: true,
        }, { status: 200 });
      }

      adjustmentHistory[adjustmentHistory.length - 1].adjustment = adjusted.reasoning;
      adjustmentHistory[adjustmentHistory.length - 1].styles = adjusted.styles;

      currentHtml = adjusted.html;
    }

    return NextResponse.json({
      success: false,
      finalHtml: currentHtml,
      iterations: iteration,
      adjustmentHistory,
      message: `Could not achieve perfect fit in ${maxIterations} iterations`,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Resume fitting error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fit resume' },
      { status: 500 }
    );
  }
}
