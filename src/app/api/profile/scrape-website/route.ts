import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function htmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|p|li|h[1-6]|div|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { url } = await request.json();
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

  let fetchUrl = url.trim();
  if (!/^https?:\/\//i.test(fetchUrl)) fetchUrl = 'https://' + fetchUrl;

  let pageText: string;
  try {
    const res = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ResumeBuilder/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Site returned ${res.status}`);
    const html = await res.text();
    pageText = htmlToText(html).slice(0, 8000);
  } catch (e) {
    return NextResponse.json(
      { error: `Could not fetch the site: ${e instanceof Error ? e.message : 'Unknown error'}. Try a different URL or paste the text manually.` },
      { status: 422 }
    );
  }

  if (!pageText.trim()) {
    return NextResponse.json({ error: 'No readable text found on this page.' }, { status: 422 });
  }

  const prompt = `You are extracting professional profile information from a personal portfolio or professional website.

WEBSITE TEXT:
${pageText}

Extract any profile-relevant information and return VALID JSON with this structure (omit sections with no data):
{
  "personalInfo": {
    "name": "full name if found",
    "email": "email if found",
    "linkedin": "linkedin url if found",
    "summary": "a 1-2 sentence positioning statement based on how they describe themselves"
  },
  "experiences": [
    {
      "id": "kebab-case-id",
      "role": "job title",
      "company": "company name",
      "dates": "date range if found",
      "bullets": ["what they did, built, or achieved"],
      "tags": []
    }
  ],
  "projects": [
    {
      "id": "kebab-case-id",
      "title": "project name",
      "description": "brief description",
      "bullets": ["key detail or achievement"],
      "tags": ["tech or skill used"]
    }
  ],
  "leadership": [],
  "skills": [
    {
      "category": "category name",
      "items": ["skill 1", "skill 2"]
    }
  ],
  "certifications": []
}

RULES:
- Only extract what is actually on the page. Do NOT invent anything.
- Portfolio projects should go in "projects", work history in "experiences".
- If something is ambiguous, put it in projects.
- Skills mentioned in project descriptions count.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const profile = JSON.parse(completion.choices[0].message.content || '{}');
  return NextResponse.json({ success: true, profile, requiresConfirmation: true });
}
