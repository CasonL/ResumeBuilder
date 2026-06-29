import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth-helpers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a precision resume editor. You are given:
1. A screenshot of a rendered resume with a dashed red line marking the exact bottom of the usable print page content area
2. The resume JSON data
3. The job description it was generated for

Your job: determine if the resume overflows the page boundary line, and if so, make the minimum surgical cuts to fit it within the target page count.

SCORING (do this first for every bullet):
- Relevance score 1 (low): bullet does not directly demonstrate a job competency
- Relevance score 2 (medium): bullet is supporting context but not core proof
- Relevance score 3 (high): bullet directly proves a must-have job competency or the strongestThread

Line count estimate (at print font, ~92 chars per line at content width):
- <92 chars = 1 line
- 92–184 chars = 2 lines
- 185+ chars = 3 lines

CUT ORDER — exhaust each step before moving to the next. Stop the moment the overflow is resolved:

STEP 1 — Score 1 + multi-line (2+ lines): REMOVE entirely. Do not shorten.
STEP 2 — Score 1 + single-line: REMOVE entirely.
STEP 3 — Score 2 + multi-line: one rewrite attempt to tighten. If rewritten bullet is still ≥92 chars, REMOVE instead. No second attempt.
STEP 4 — Score 3 + multi-line: shorten ONLY IF the core mechanism AND any metric/number are both fully preserved after shortening. If shortening would remove the number or mechanism, SKIP this bullet entirely — do not touch it.
STEP 5 — Drop entire low-signal sections: Certifications first, then Projects. Never Experience or Leadership.
STEP 6 — Last resort: remove the single least-relevant experience from selectedExperiences.

HARD RULES:
- STOP cutting the moment the overflow is resolved. Do not over-trim.
- Never reduce any single role below 2 bullets. If you would need to, skip that role and move to the next cut step.
- Never touch any bullet that directly proves the strongestThread.
- Never remove a metric (number, %, $, ratio) from a Score 3 bullet.
- If the resume already fits within the page boundary, return action: "ok" and no changes.

Return valid JSON:
{
  "action": "ok" | "trimmed" | "expanded",
  "estimatedOverflowPx": number (pixels below the boundary line, 0 if none),
  "cutsMade": ["brief description of each change made"],
  "revisedData": { ...complete revised resume JSON... } | null
}`;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { screenshot, resumeData, masterData, targetLength, jobDescription } = await request.json();

    if (!screenshot || !resumeData) {
      return NextResponse.json({ error: 'Missing screenshot or resumeData' }, { status: 400 });
    }

    const targetPages = targetLength === '1-page' ? 1 : 2;

    // Slim masterData: only send selected items to reduce token count
    const selectedIds = new Set([
      ...(resumeData.selectedExperiences || []),
      ...(resumeData.selectedLeadership || []),
      ...(resumeData.selectedProjects || []),
    ]);
    const slimMaster = masterData ? {
      personalInfo: masterData.personalInfo,
      education: masterData.education,
      experiences: (masterData.experiences || []).filter((e: any) => selectedIds.has(e.id)),
      leadership: (masterData.leadership || []).filter((e: any) => selectedIds.has(e.id)),
      projects: (masterData.projects || []).filter((e: any) => selectedIds.has(e.id)),
      certifications: masterData.certifications,
    } : null;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: screenshot, detail: 'high' },
            },
            {
              type: 'text',
              text: `Target: exactly ${targetPages} page(s).

The dashed red line marks the exact bottom of usable content for page ${targetPages}. Any content below = overflow to eliminate.

STRONGEST THREAD (never cut): ${resumeData.fitAssessment?.strongestThread || 'not specified'}

JOB DESCRIPTION:
${(jobDescription || '').substring(0, 800)}

RESUME JSON:
${JSON.stringify(resumeData)}

MASTER DATA (selected items only):
${JSON.stringify(slimMaster)}

Apply the cut order. Return the complete revised resumeData JSON with all fields preserved.`,
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 8000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Vision refinement error:', error);
    return NextResponse.json(
      { error: 'Refinement failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
