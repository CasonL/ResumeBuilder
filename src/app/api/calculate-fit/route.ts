import { NextRequest, NextResponse } from 'next/server';
import { ResumePageCalculator } from '@/lib/resume-calculator';

export async function POST(request: NextRequest) {
  try {
    const { elements, targetPages } = await request.json();

    if (!elements || !targetPages) {
      return NextResponse.json(
        { error: 'Missing elements or targetPages' },
        { status: 400 }
      );
    }

    const calculator = new ResumePageCalculator(targetPages);
    const optimalConfig = calculator.optimizeSpacing(elements);
    const estimatedHeight = calculator.calculateTotalHeight(elements, optimalConfig);
    const targetHeight = targetPages * (11 * 96);
    const css = calculator.generateCSS(optimalConfig);

    return NextResponse.json({
      success: true,
      optimalConfig,
      estimatedHeight,
      targetHeight,
      fitPercentage: (estimatedHeight / targetHeight) * 100,
      css,
      elements,
    });
  } catch (error: any) {
    console.error('Calculate fit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate fit' },
      { status: 500 }
    );
  }
}
