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
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, ' ')
    .replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
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
    pageText = htmlToText(await res.text()).slice(0, 8000);
  } catch (e) {
    return NextResponse.json(
      { error: `Could not reach that site: ${e instanceof Error ? e.message : 'Unknown error'}. Try a different URL.` },
      { status: 422 }
    );
  }

  if (!pageText.trim()) {
    return NextResponse.json({ error: 'No readable text found on this page.' }, { status: 422 });
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `You are reading someone's personal portfolio or professional website. Write a thorough, factual summary of who this person is and what they have built or done professionally. Cover: what they've built or shipped, roles they've held, notable projects, skills and technologies used, and any measurable achievements. Be specific — names, numbers, and outcomes where available. Write in third person. 3-6 sentences. Do not invent anything not on the page.\n\nWEBSITE TEXT:\n${pageText}`,
    }],
    temperature: 0.3,
    max_tokens: 400,
  });

  const summary = completion.choices[0].message.content?.trim() || '';
  return NextResponse.json({ success: true, summary, url: fetchUrl });
}
