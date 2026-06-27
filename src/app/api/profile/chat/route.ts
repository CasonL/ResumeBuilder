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
1. A brief acknowledgment of what you learned.
2. A JSON block containing the COMPLETE updated profile under the key "updatedProfile".

Example JSON block format:
\`\`\`json
{ "updatedProfile": { ...complete profile object... } }
\`\`\`

RULES:
- Never invent facts. Only add what the user explicitly tells you.
- Keep existing data intact — only add or improve.
- If just asking a question, do NOT include the JSON block.
- Keep responses concise. One question, one update.
- Prioritize filling gaps in: bullet points with metrics, projects with outcomes, skills implied by experience.`;

  const chatMessages: Anthropic.MessageParam[] = [
    ...messages.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ];

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: chatMessages,
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

  let updatedProfile = null;
  let cleanText = text;

  // Try fenced code block with or without newlines
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try {
      const parsed = JSON.parse(fenced[1]);
      updatedProfile = parsed.updatedProfile || null;
      cleanText = text.replace(/```(?:json)?\s*[\s\S]*?\s*```/, '').trim();
    } catch {
      // not valid JSON in fence
    }
  }

  // Fallback: find largest JSON object in text
  if (!updatedProfile) {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      try {
        const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        if (parsed.updatedProfile) {
          updatedProfile = parsed.updatedProfile;
          cleanText = (text.slice(0, jsonStart) + text.slice(jsonEnd + 1)).trim();
        }
      } catch {
        // not valid JSON
      }
    }
  }

  const reply = cleanText || 'Profile updated.';

  return NextResponse.json({ reply, updatedProfile });
}
