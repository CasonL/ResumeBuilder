import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth-helpers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a precision resume editor. You receive a layout report with exact pixel overflow.
Your job: return ONLY a minimal list of changes to eliminate the overflow. Do NOT return the full resume JSON.

Each line of body text = ~16px. Each bullet removal saves: estimatedLines × 16px.
Hiding certifications saves ~80px. Hiding skills saves ~100px. Removing an experience saves 80–180px.

SCORING each bullet:
- Score 1 (low): does not directly prove a job competency
- Score 2 (medium): supporting context
- Score 3 (high): directly proves a must-have competency or the strongestThread

CUT ORDER — stop the moment overflow is eliminated:
STEP 1 — Score 1, estimatedLines ≥ 2: remove_bullet
STEP 2 — Score 1, estimatedLines = 1: remove_bullet
STEP 3 — Score 2, estimatedLines ≥ 2: rewrite_bullet (must be <90 chars; if not possible, remove_bullet)
STEP 4 — Score 3, estimatedLines ≥ 2: rewrite_bullet only if metric AND mechanism preserved; else skip
STEP 5 — hide_section: "certifications" first, then "skills"
STEP 6 — remove_experience: single least-relevant role

HARD RULES:
- Never reduce a role below 2 bullets (skip that role, go to next step)
- Never touch bullets proving the strongestThread
- Never remove a metric from a Score 3 bullet
- Return action "ok" with empty changes[] if overflowPx = 0

Return ONLY this JSON (no other fields):
{
  "action": "ok" | "trimmed",
  "changes": [
    {"type": "remove_bullet",   "roleId": "<id>", "bulletIndex": <0-based int>},
    {"type": "rewrite_bullet",  "roleId": "<id>", "bulletIndex": <0-based int>, "newText": "<string>"},
    {"type": "hide_section",    "section": "<certifications|skills|projects>"},
    {"type": "remove_experience","roleId": "<id>"}
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { layoutReport, targetLength, jobDescription, strongestThread, sections } = await request.json();

    if (!layoutReport) {
      return NextResponse.json({ error: 'Missing layoutReport' }, { status: 400 });
    }

    if (layoutReport.overflowPx <= 0) {
      return NextResponse.json({ action: 'ok', changes: [] });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Target: ${targetLength}.
Overflow to eliminate: ${layoutReport.overflowPx}px out of ${layoutReport.totalHeightPx}px total.

STRONGEST THREAD (never cut): ${strongestThread || 'not specified'}

JOB DESCRIPTION (first 500 chars):
${(jobDescription || '').substring(0, 500)}

SECTIONS PRESENT: ${JSON.stringify(sections)}

ROLES AND BULLETS (with pixel heights and line counts):
${JSON.stringify(layoutReport.roles, null, 2)}

Return only the changes JSON.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
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
