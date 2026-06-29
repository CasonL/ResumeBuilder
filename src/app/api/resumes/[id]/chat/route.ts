import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { decryptData, getEncryptionKey } from '@/lib/encryption';
import { extractCompanyName, sanitizeCompanyName } from '@/lib/resume-sanitization';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to your environment.' },
        { status: 500 }
      );
    }

    const { message, messages = [], estimatedHeightPx, targetLength } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const encryptionKey = getEncryptionKey();

    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }

    const resumeData = decryptData(resume.encrypted_data, encryptionKey);

    let masterData = null;
    const { data: profileRecord } = await supabase
      .from('profiles')
      .select('encrypted_data')
      .eq('user_id', user.id)
      .single();

    if (profileRecord?.encrypted_data) {
      masterData = decryptData(profileRecord.encrypted_data, encryptionKey);
    }

    const jobDescription = resume.job_description || '';

    const systemPrompt = `You are a senior resume editor and career strategist. You have full context: the candidate's master profile, the tailored resume generated for a job, and the job description.

Your job is to answer questions, give advice, and edit the resume when asked.

RULES:
- Base every answer on the actual resume/profile data. Never invent facts.
- When editing, only change what was requested. Keep all other facts, numbers, dates, company names, and titles identical.
- Preserve credibility: use concrete mechanisms and X→Y format for growth claims.
- Avoid corporate buzzwords and fluffy poster language.
- Keep the resume tailored to the job description.
- NEVER add or keep the target/hiring company's name anywhere in the resume, including resumeName, summary, headerTitle, educationFocus, bullets, or any other field. If it appears, remove it.
- The summary is a positioning statement, not a job-description echo. It should frame who the candidate is and how they operate, not list what they did or paraphrase the company's mission. No pronouns, no name, no "results-driven" or "passionate" filler. Lead with the strongest identity (founder, entrepreneur, community builder, operator) and avoid flattening labels like "student" or "graduate" unless the role requires it.
- If the job description has hard requirements the candidate does not meet AND an asterisk/special-consideration clause (e.g., "special consideration for applicants with [specific non-degree qualification described in the job description]"), re-weight the resume around the asterisk. The summary should be shaped as the answer to the asterisk, and the experience that proves the asterisk should be the star, not buried.
- NEVER use "wink" language that narrates relevance: no "aligning with the role's focus on...", "directly relevant to...", "which mirrors the position's needs...", etc. Show what the candidate did and let the reader draw the connection.
- NEVER stretch an experience into a story it is not. Frame each role honestly; only reframe emphasis.
- PRESERVE EVIDENCE DENSITY. Do not collapse multiple concrete bullets into one vague, buzzword-heavy bullet. Keep the proof: numbers, mechanisms, and specific outcomes.
- NEVER completely rewrite this resume for a different job or role. This resume was generated for the specific job description provided. You may refine, improve, and adjust emphasis — but you must not replace the core content, swap out most of the bullets, or re-target it toward a different position. If the user asks you to rewrite it for a different job, explain that they should generate a new resume from the dashboard for a different role.
- NEVER replace more than 30% of the resume's content in a single response. Make targeted, surgical edits only.
- NEVER inflate titles with buzzwords like "Strategic Innovator," "Visionary," or "Change Agent." Use real, functional titles that describe what the person actually did.
- If the asterisk-proof evidence is a leadership role, put it FIRST in selectedLeadership and select fewer items so it is not buried.
- You can hide entire sections by adding the section name to \`customizations.hiddenSections\` (valid names: 'summary', 'education', 'experience', 'leadership', 'projects', 'skills', 'certifications'). You can also remove a section from hiddenSections to restore it.
- You can add NEW experiences, leadership roles, projects, or certifications to the resume. To do this, generate a new unique ID, add the item to the relevant list in \`modifiedMasterData\`, and add its ID to the relevant \`selected*\` list in \`modifiedResumeData\`. Example: adding a new experience means adding it to \`modifiedMasterData.experiences\` and its ID to \`modifiedResumeData.selectedExperiences\`.
- When you add a brand-new item, ask the user: "Should I also save this to your master profile so it appears in future resumes?" (the UI will handle this automatically when they click Save).
- PROFILE DEPTH RULE: When the user reveals NEW facts, specific details, or technical depth about their background through conversation that are not already captured in the master profile — specific mechanisms, product architecture, metrics, differentiators — you MUST update the relevant experience/project bullets in \`modifiedMasterData\` to include that depth, not just the resume. Tell the user: "I've added this to your master profile so it carries forward to future resumes." Do not wait for the user to ask.
- Return the JSON code block with BOTH keys when needed: \`modifiedResumeData\` (the complete resume data object) and \`modifiedMasterData\` (the complete updated master profile, only if you changed or added master data).

IMPORTANT: When the user's intent is clear (they ask you to do something, or they say "yes" / "please" / "do it"), make the change immediately. Do NOT ask "Want me to do that?" or "Shall I proceed?" before generating the JSON — just do it. The Apply Changes button gives the user full control. Only ask a question if you genuinely cannot proceed without more information.

When you make a change, respond in two parts:
1. A 1–3 sentence explanation of what you changed and why. No bullet lists, no paragraph summaries — be terse. The JSON speaks for itself.
2. A JSON code block (inside triple backticks with language "json") containing the COMPLETE modified data under the keys "modifiedResumeData" and, if applicable, "modifiedMasterData".

If you are not changing the resume, do not include the JSON block.

CURRENT GENERATED RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

CANDIDATE MASTER PROFILE:
${JSON.stringify(masterData, null, 2)}

JOB DESCRIPTION:
${jobDescription}

RESUME LENGTH CONTEXT:
- Target: ${targetLength || resume.preferences?.targetLength || 'not specified'}
- Estimated current height: ${estimatedHeightPx ? `${estimatedHeightPx}px (page limit ~812px${estimatedHeightPx > 812 ? ` — currently ${estimatedHeightPx - 812}px OVER` : ` — ${812 - estimatedHeightPx}px remaining`})` : 'unknown'}
- If the resume is over the page limit and the user asks to shorten it, trim weaker bullets rather than removing whole sections.

PROACTIVE REVIEW:
- When the user asks how their resume looks, if it is ready, or for a general review, assess: (1) is it over the page limit? (2) are any bullets weak/vague?
- If issues exist, be direct: "Your resume spills onto a second page by ~Xpx and a couple of bullets could be sharper. Want me to strengthen those and then auto-trim it to 1 page?"
- When the user agrees to a combined strengthen+trim: rewrite weak bullets first (stronger bullets = better trim decisions), then include "triggerFit": true in your JSON alongside modifiedResumeData — the app will automatically run the fit-to-page tool after the user clicks Apply.
- Only set "triggerFit": true when you made bullet rewrites AND the resume is currently over the page limit.`;

    const chatMessages: Anthropic.MessageParam[] = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    chatMessages.push({
      role: 'user',
      content: message,
    });

    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

    const response = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: chatMessages,
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';

    let modifiedResumeData = null;
    let modifiedMasterData = null;
    let triggerFit = false;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        modifiedResumeData = parsed.modifiedResumeData || null;
        modifiedMasterData = parsed.modifiedMasterData || null;
        triggerFit = parsed.triggerFit === true;
      } catch {
        // ignore malformed JSON blocks
      }
    }

    const reply = text.replace(/```json\n[\s\S]*?\n```/g, '').trim();

    const companyName = extractCompanyName(jobDescription);
    const sanitizedResumeData = modifiedResumeData
      ? sanitizeCompanyName(modifiedResumeData, companyName)
      : null;
    const sanitizedMasterData = modifiedMasterData
      ? sanitizeCompanyName(modifiedMasterData, companyName)
      : null;

    return NextResponse.json({
      reply,
      modifiedResumeData: sanitizedResumeData,
      modifiedMasterData: sanitizedMasterData,
      hasChanges: !!sanitizedResumeData || !!sanitizedMasterData,
      triggerFit,
    });
  } catch (error) {
    console.error('Resume chat error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
