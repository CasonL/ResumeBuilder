import OpenAI from 'openai';
import { PDFMeasurement } from './pdf-utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AdjustmentResult {
  html: string;
  reasoning: string;
}

export async function adjustResumeContent(
  htmlContent: string,
  adjustmentType: 'shrink' | 'expand' | 'fine-tune',
  targetPages: number,
  measurement: PDFMeasurement
): Promise<AdjustmentResult> {
  
  const systemPrompt = `You are a resume optimization expert. Your job is to adjust resume content to fit EXACTLY ${targetPages} page(s).

Current status:
- Current page count: ${measurement.pageCount}
- Target page count: ${targetPages}
- Content height: ${measurement.contentHeight}px
- Page height: ${measurement.pageHeight}px
- Overflow: ${measurement.overflow ? 'Yes' : 'No'}
${measurement.overflowAmount ? `- Overflow amount: ${measurement.overflowAmount}px` : ''}

Action needed: ${adjustmentType}

Rules:
1. Maintain all factual information and achievements
2. Keep the resume professional and impactful
3. ${adjustmentType === 'shrink' ? 'Make content more concise - combine bullets, remove less impactful details, tighten wording' : ''}
4. ${adjustmentType === 'expand' ? 'Add more detail and examples - expand bullets, add context, elaborate on achievements' : ''}
5. ${adjustmentType === 'fine-tune' ? 'Make micro-adjustments to line breaks, spacing, or wording to eliminate small overflow' : ''}
6. Return ONLY the modified HTML content, preserving all structure and CSS classes
7. DO NOT add explanations or markdown - just the HTML`;

  const userPrompt = `Adjust this resume HTML to fit exactly ${targetPages} page(s). Currently it's ${measurement.pageCount} pages.

${htmlContent}

Return ONLY the adjusted HTML with no explanations.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 16000,
  });

  const adjustedHtml = response.choices[0].message.content || htmlContent;
  
  return {
    html: adjustedHtml.trim(),
    reasoning: `Applied ${adjustmentType} adjustment to move from ${measurement.pageCount} to ${targetPages} pages`,
  };
}

export async function estimateContentSufficiency(htmlContent: string): Promise<{
  canFillTwoPages: boolean;
  estimatedPages: number;
  recommendation: string;
}> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Analyze resume content and determine if there's enough substantial information to fill 2 full pages without excessive padding or repetition. Respond with JSON only: {"canFillTwoPages": boolean, "estimatedPages": number, "recommendation": string}`,
      },
      {
        role: 'user',
        content: htmlContent,
      },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  
  return {
    canFillTwoPages: result.canFillTwoPages ?? false,
    estimatedPages: result.estimatedPages ?? 1,
    recommendation: result.recommendation || 'Unable to assess content sufficiency',
  };
}
