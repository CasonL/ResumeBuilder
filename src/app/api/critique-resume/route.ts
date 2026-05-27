import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth-helpers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const { jobDescription, resumeContent, masterData } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!jobDescription || !resumeContent || !masterData) {
      return NextResponse.json(
        { error: 'Job description, resume content, and master data are required' },
        { status: 400 }
      );
    }

    const critiquePrompt = `You are a ruthless resume reviewer and editor. Your job is to make this resume maximally credible, specific, and outcome-driven for the target role.

JOB DESCRIPTION:
${jobDescription}

GENERATED RESUME CONTENT:
${JSON.stringify(resumeContent, null, 2)}

USER'S MASTER DATA (full background):
${JSON.stringify(masterData, null, 2)}

TASKS - EXECUTE IN ORDER:

A) SCAN DIAGNOSIS (Priority Issues)
Identify the highest-impact issues in this order:
1. **Role alignment and framing**: Does the top 1/3 (headline, summary, education focus) scream fit in 5 seconds?
2. **Proof of outcomes**: Where are results missing? (shipped deliverables, metrics, what changed)
3. **Decision-making + ownership**: Where do bullets describe activity but not judgment/tradeoffs?
4. **Product/process thinking**: Where are "insight → decision → execution → impact" loops absent?
5. **Specificity**: Where are nouns/verbs vague, generic, or cliché?
6. **Credibility risks**: Anything that sounds inflated or unverifiable?

For each issue, cite the exact line/bullet and explain WHY it's weak.

B) TOP SECTION CRITIQUE
Evaluate:
- **Education Focus**: Does "${resumeContent.customizations?.educationFocus || 'not set'}" immediately signal fit for this role?
- **First impression**: If recruiter scans top 1/3 for 5 seconds, what role do they think this is for?
- **Missing signal**: What's the strongest PM/role-specific hook that should be in the top section but isn't?

C) KEYWORD & SIGNAL EXTRACTION
From the job description, extract:
- **Top signals the resume currently communicates** (what a skim reader concludes in 8 seconds)
- **Top missing signals** (what a skim reader needs but won't infer)
- **Top 15 keywords/phrases** from job description that should appear naturally

D) SKILLS SECTION DIAGNOSIS
Current skills: ${JSON.stringify(resumeContent.selectedSkills)}

Critique:
- Are these skills **generic tool names** (Excel, PowerPoint, Teams) or **role-specific behaviors** (customer discovery, prioritization, experimentation)?
- Do they read like template filler or genuine competencies?
- What would make a recruiter think "this person can do THE JOB" not "this person can open software"?

E) BULLET-BY-BULLET CRITIQUE
For each major experience/leadership/project bullet, identify:
- **What's missing**: Outcome? Metric? Decision? Tradeoff? What shipped?
- **Weak verbs**: Generic action words that don't show ownership
- **Missed opportunity**: What could this bullet prove about the candidate that it currently doesn't?

F) ROLE-SPECIFIC FRAMING GAPS
Based on role type (PM/Sales/Eng/Ops), identify:
- Where technical/builder language should be reframed as product thinking
- Where activity should be reframed as decision-making
- Where generic "led/managed" should be role-specific "designed/shipped/optimized"

CRITICAL RULES:
- Be SPECIFIC. Don't say "add metrics" - say "PitchIQ bullet should include activation rate or weekly iteration cycles"
- Reference actual bullet points by experience ID and text
- Only suggest changes the master data supports
- Focus on FRAMING not FABRICATION
- Catch the "quiet killers": weak top section, generic skills, no proof of shipping/measuring/iterating

Return VALID JSON with this exact structure:
{
  "roleType": "string - detected role type",
  "overallAssessment": "string - 2-3 sentence summary: what's working, what's killing you",
  "topSectionIssues": {
    "educationFocusIssue": "string - what's wrong with current education focus line",
    "suggestedEducationFocus": "string - role-forward alternative",
    "firstImpressionProblem": "string - what role recruiter thinks this is for in first 5 seconds",
    "missingPMHook": "string - strongest signal that should be in top 1/3 but isn't"
  },
  "skillsSectionIssues": {
    "currentApproach": "string - why current skills are weak/generic",
    "suggestedSkills": ["array of 8-12 role-specific behavior phrases"],
    "rationale": "string - why these matter for this role"
  },
  "bulletCritiques": [
    {
      "experienceId": "string - ID from resumeContent",
      "currentBullet": "string - exact bullet text",
      "whatsMissing": "string - outcome/metric/decision/tradeoff/shipped deliverable",
      "weakVerbs": ["array of generic verbs used"],
      "suggestedRewrite": "string - specific stronger version with placeholders [X] if needed"
    }
  ],
  "missingProof": {
    "noShippedDeliverables": ["array of experiences where nothing shipped is mentioned"],
    "noMetrics": ["array of experiences missing any measurement"],
    "noDecisionMaking": ["array of bullets that describe activity but not judgment"],
    "noIterationLoop": ["array where insight→decision→execution→impact loop is absent"]
  },
  "framingGaps": [
    {
      "experienceId": "string",
      "currentFraming": "string - how it's framed now",
      "issue": "string - why this framing is wrong for the role",
      "roleSpecificReframe": "string - how to reframe for target role"
    }
  ],
  "quickWins": [
    "array of 3-5 highest-ROI changes ranked by impact"
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume consultant who provides specific, actionable critique. Return valid JSON only.'
        },
        {
          role: 'user',
          content: critiquePrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    const critique = JSON.parse(result);

    return NextResponse.json({
      success: true,
      critique,
    });

  } catch (error) {
    console.error('Resume critique error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to critique resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
