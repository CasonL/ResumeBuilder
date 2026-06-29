import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth-helpers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a precision resume editor. You receive exact pixel measurements of a rendered resume at print font size, and the resume JSON.

Your job: make the minimum surgical cuts so the resume fits within the target page height.

SCORING (do this first for every bullet):
- Relevance score 1 (low): bullet does not directly demonstrate a job competency
- Relevance score 2 (medium): supporting context but not core proof
- Relevance score 3 (high): directly proves a must-have job competency or the strongestThread

CUT ORDER — exhaust each step before moving to the next. Stop the moment overflow is resolved:

STEP 1 — Score 1 + estimatedLines ≥ 2: REMOVE entirely.
STEP 2 — Score 1 + estimatedLines = 1: REMOVE entirely.
STEP 3 — Score 2 + estimatedLines ≥ 2: one rewrite to tighten below 92 chars. If still ≥92 chars, REMOVE. No second attempt.
STEP 4 — Score 3 + estimatedLines ≥ 2: shorten ONLY IF core mechanism AND any metric/number are fully preserved. If not possible, SKIP.
STEP 5 — Hide entire low-signal sections via hiddenSections: 'certifications' first, then 'projects'. Never 'experience' or 'leadership'.
STEP 6 — Last resort: remove single least-relevant ID from selectedExperiences.

HARD RULES:
- STOP cutting the moment overflow is resolved. Never over-trim.
- Never reduce any role below 2 bullets. Skip that role, move to next step.
- Never touch bullets that prove the strongestThread.
- Never remove a metric (number, %, $, ratio) from a Score 3 bullet.
- If overflowPx = 0, return action: "ok" with no changes.

Return valid JSON:
{
  "action": "ok" | "trimmed",
  "overflowPx": number,
  "cutsMade": ["brief description of each change"],
  "revisedData": { ...complete resume JSON... } | null
}`;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { layoutReport, resumeData, masterData, targetLength, jobDescription } = await request.json();

    if (!layoutReport || !resumeData) {
      return NextResponse.json({ error: 'Missing layoutReport or resumeData' }, { status: 400 });
    }

    if (layoutReport.overflowPx <= 0) {
      return NextResponse.json({ action: 'ok', overflowPx: 0, cutsMade: [], revisedData: null });
    }

    const selectedIds = new Set([
      ...(resumeData.selectedExperiences || []),
      ...(resumeData.selectedLeadership || []),
      ...(resumeData.selectedProjects || []),
    ]);
    const slimMaster = masterData ? {
      experiences: (masterData.experiences || []).filter((e: any) => selectedIds.has(e.id)),
      leadership: (masterData.leadership || []).filter((e: any) => selectedIds.has(e.id)),
      certifications: masterData.certifications,
    } : null;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Target: ${targetLength} (page content height = ${layoutReport.pageHeightPx}px).

LAYOUT MEASUREMENT:
- Rendered height: ${layoutReport.totalHeightPx}px
- Page limit: ${layoutReport.pageHeightPx}px  
- Overflow: ${layoutReport.overflowPx}px (must eliminate this many pixels)

ROLES WITH BULLET MEASUREMENTS:
${JSON.stringify(layoutReport.roles, null, 2)}

STRONGEST THREAD (never cut): ${resumeData.fitAssessment?.strongestThread || 'not specified'}

JOB DESCRIPTION:
${(jobDescription || '').substring(0, 600)}

RESUME JSON:
${JSON.stringify(resumeData)}

MASTER DATA (selected items only):
${JSON.stringify(slimMaster)}

Apply the cut order. Eliminate ${layoutReport.overflowPx}px of content. Return complete revised resumeData.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 8000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Resume fit error:', error);
    return NextResponse.json(
      { error: 'Refinement failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
