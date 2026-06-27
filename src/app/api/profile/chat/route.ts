import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth-helpers';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
  }

  const { message, messages = [], profileData } = await request.json();
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  const systemPrompt = `You are a profile coach helping someone build a strong resume master profile. Your job is to ask targeted questions to extract concrete, resume-worthy details they may have forgotten to include.

CURRENT PROFILE:
${JSON.stringify(profileData, null, 2)}

YOUR APPROACH:
- Ask ONE focused question at a time. Don't overwhelm.
- Dig for specifics: numbers, metrics, outcomes, technologies, team sizes.
- When the user gives you a good answer, extract the structured data and update the profile.
- Look for gaps: missing bullet points, vague descriptions, undocumented skills, forgotten projects.
- Be conversational and encouraging. Keep it short.

WHEN TO UPDATE THE PROFILE:
When the user shares information worth adding, respond with:
1. A brief acknowledgment (1-2 sentences max).
2. A JSON block containing ONLY the sections that changed, under the key "profilePatch".

Example — only send what changed:
\`\`\`json
{ "profilePatch": { "experiences": [ ...only the updated experiences array... ] } }
\`\`\`

IMPORTANT: Only include the sections that actually changed (e.g. just "experiences" or just "skills"). Do NOT send the full profile — it is too large.

RULES:
- Never invent facts. Only add what the user explicitly tells you.
- Preserve all existing items in a section — don't drop entries.
- If just asking a question, do NOT include the JSON block.
- Keep responses concise. One question, one update.
- Prioritize filling gaps in: bullet points with metrics, projects with outcomes, skills implied by experience.`;

  const chatMessages: Anthropic.MessageParam[] = [
    ...messages.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ];

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: chatMessages,
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

  let profilePatch: Record<string, any> | null = null;
  let cleanText = text;

  const extractJSON = (src: string) => {
    // Try fenced code block
    const fenced = src.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced) {
      try { return JSON.parse(fenced[1]); } catch {}
    }
    // Try raw JSON object
    const start = src.indexOf('{');
    const end = src.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try { return JSON.parse(src.slice(start, end + 1)); } catch {}
    }
    return null;
  };

  const parsed = extractJSON(text);
  if (parsed?.profilePatch) {
    profilePatch = parsed.profilePatch;
    cleanText = text.replace(/```(?:json)?\s*[\s\S]*?\s*```/, '')
      .replace(/\{[\s\S]*\}/, '').trim();
  } else if (parsed?.updatedProfile) {
    // Legacy fallback: full profile returned
    profilePatch = parsed.updatedProfile;
    cleanText = text.replace(/```(?:json)?\s*[\s\S]*?\s*```/, '')
      .replace(/\{[\s\S]*\}/, '').trim();
  }

  const reply = cleanText || 'Done.';

  return NextResponse.json({ reply, profilePatch });
}
