import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth-helpers';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const { profileData } = await request.json();
    if (!profileData) return NextResponse.json({ error: 'Profile data is required' }, { status: 400 });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a world-class resume writer. You write positioning statements — theses, not summaries — that tell a hiring manager what to believe about every line below them. Facts only, zero filler. Return valid JSON only.',
        },
        {
          role: 'user',
          content: `Write a professional thesis and a background brief from this profile.

PROFILE DATA:
${JSON.stringify(profileData, null, 2)}

━━━ PROFESSIONAL THESIS ━━━
Target: 20-35 words. ONE or TWO sentences maximum. Not a summary — a positioning claim.

A thesis answers: "What is the single most important thing to know about this candidate?"
It is NOT a list of accomplishments. It is the lens through which all accomplishments should be read.

VOICE: No name. No I/he/she/they. Subject-less declarative sentences only.

EXAMPLES (study the difference):
✓ THESIS: "Founder who ships — built PitchIQ from zero to paying customers by treating every customer conversation as a product spec."
✓ THESIS: "Operator who has sat in the seat: sold door-to-door, managed a $500K painting territory, and then built AI tools to make salespeople better at it."
✗ SUMMARY (wrong): "Built and launched an AI-driven sales training platform, PitchIQ, transforming over 60 customer interviews into a comprehensive product roadmap. Achieved $42K+ in sales at College Pro through targeted marketing strategies."
  → Why wrong: that’s a two-bullet recap of the resume, not a claim about who this person is.

FORBIDDEN WORDS (auto-fail if used): leverages, passionate, motivated, results-driven, hardworking, dynamic, innovative, revolutionize, substantial, cutting-edge, high-impact, strategic vision, proven track record, seeking, synergy, comprehensive, transforming, spearheaded

USE ONLY FACTS from the profile. Do not invent metrics.

━━━ BACKGROUND BRIEF (3-5 sentences) ━━━
Third-person factual narrative for internal AI context — not shown to users publicly.
Cover: roles held, companies, what they built or led, technical/domain strengths, real achievements.
NO invented aspirations or personality traits.

Return JSON:
{
  "professionalSummary": "...",
  "backgroundBrief": "..."
}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 400,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);

  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
