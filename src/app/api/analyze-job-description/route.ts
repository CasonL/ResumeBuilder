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
    const { jobDescription, masterData } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    // FLOW 1: Extract Job Attributes
    const analysisPrompt = `Analyze this job description and extract key attributes.

JOB DESCRIPTION:
${jobDescription}

Extract the following information and return VALID JSON:
{
  "industry": "string (e.g., Technology, Finance, Healthcare, Marketing, etc.)",
  "seniority": "string (Entry-level, Mid-level, Senior, Director, Executive)",
  "yearsRequired": "string (e.g., '0-2', '3-5', '5+', '10+')",
  "companyType": "string (Startup, SMB, Enterprise, Agency, Non-profit)",
  "cultureTone": "string (Formal, Casual, Innovative, Traditional)",
  "keyRequirements": ["array of 5-8 most important requirements/skills from job description"],
  "emphasizedAreas": ["array of areas heavily emphasized: e.g., 'Technical Skills', 'Leadership', 'Project Management', 'Certifications', 'Education']
}

Be precise and base analysis only on what's in the job description.`;

    const analysisCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a job description analyzer. Extract structured attributes. Return valid JSON only.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const jobAttributes = JSON.parse(analysisCompletion.choices[0].message.content || '{}');

    // FLOW 2: Generate Recommendations Based on Attributes
    const recommendationPrompt = `Based on these job attributes, recommend optimal resume preferences.

JOB ATTRIBUTES:
${JSON.stringify(jobAttributes, null, 2)}

Generate smart recommendations and return VALID JSON:
{
  "targetLength": "1-page" or "2-page",
  "layoutStyle": "balanced-columns" or "content-heavy" or "sidebar-focus",
  "tone": "professional" or "creative" or "technical",
  "prioritySections": ["array of sections to prioritize from: Work Experience, Leadership, Projects, Technical Skills, Certifications"],
  "reasoning": {
    "length": "Brief explanation why this length is recommended",
    "layout": "Brief explanation why this layout suits the role",
    "tone": "Brief explanation why this tone fits the company/role",
    "sections": "Brief explanation which sections matter most"
  }
}

STRICT RECOMMENDATION LOGIC (FOLLOW EXACTLY):

**Length:**
- Entry/Mid-level (0-5 years) → 1-page
- Senior+ (5+ years) → 2-page

**Layout:**
- Tech/Engineering roles → balanced-columns
- Creative/Design/Marketing → sidebar-focus
- Corporate/Business/Finance → content-heavy

**Tone:**
- Startup/Innovative culture → creative
- Traditional/Enterprise/Formal → professional
- Heavy technical requirements → technical

**Priority Sections (FOLLOW THESE RULES):**
1. Select 2-4 sections from: Work Experience, Leadership, Projects, Technical Skills, Certifications
2. Map emphasizedAreas to sections:
   - "Technical Skills" or "Certifications" → include "Technical Skills"
   - "Leadership" or "Management" → include "Leadership"
   - "Project Management" or "Projects" → include "Projects"
   - "Certifications" or "Professional Development" → include "Certifications"
3. Work Experience is important but NOT mandatory - only include if emphasizedAreas mentions work history, experience, or if no other clear priorities
4. Prioritize sections that match emphasizedAreas most directly
5. If emphasizedAreas is vague, default to: ["Work Experience", "Technical Skills"]

**Examples:**

emphasizedAreas: ["Technical Skills", "Leadership", "Project Management"]
→ prioritySections: ["Technical Skills", "Leadership", "Projects"]

emphasizedAreas: ["Certifications", "Technical Skills"]
→ prioritySections: ["Technical Skills", "Certifications"]

emphasizedAreas: ["Leadership", "Management Experience"]
→ prioritySections: ["Work Experience", "Leadership"]

emphasizedAreas: ["Project Delivery", "Technical Skills", "Certifications"]
→ prioritySections: ["Projects", "Technical Skills", "Certifications"]

Be consistent but flexible. Match the job's actual priorities, not a rigid formula.`;

    const recommendationCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a resume strategy consultant. Generate optimal recommendations based on job analysis. Return valid JSON only.'
        },
        {
          role: 'user',
          content: recommendationPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const recommendations = JSON.parse(recommendationCompletion.choices[0].message.content || '{}');

    // FLOW 3: Quick fit check if masterData provided
    let fitAssessment = null;
    if (masterData) {
      const profile = {
        experiences: (masterData.experiences || []).map((e: any) => `${e.role} at ${e.company}: ${(e.bullets || []).join('; ')}`),
        leadership: (masterData.leadership || []).map((l: any) => `${l.role} at ${l.company}: ${(l.bullets || []).join('; ')}`),
        projects: (masterData.projects || []).map((p: any) => `${p.name}: ${(p.bullets || []).join('; ')}`),
        skills: (masterData.skills || []).flatMap((s: any) => s.items || []),
      };

      const fitPrompt = `You are a senior hiring manager. Score how well this candidate fits this job. Be brutally honest — do not inflate for soft skills or potential.

SCORING RULES (follow exactly):
1. Identify the 3-5 MUST-HAVE competencies the role explicitly requires (e.g. "contract renewals", "CRM maintenance", "pricing negotiations", "B2B account management").
2. For each must-have, determine if the candidate has DIRECT experience (they have literally done that thing) vs TRANSFERABLE (adjacent but not the same thing).
3. DIRECT experience in a must-have = contributes normally to the score.
   TRANSFERABLE but not direct = contributes half credit at most.
   Zero evidence = a hard cap: missing even ONE core must-have keeps the score at 6 or below. Missing two or more caps it at 4 or below.
4. Soft skills (communication, work ethic, leadership) can only add +1 at most. They cannot compensate for missing core competencies.
5. Do NOT let skill keywords in the candidate's profile fool you. "Customer Relationship Management" as a listed skill is NOT the same as having done B2B account management. "Sales" is NOT the same as renewal management. Read what they actually DID, not what they listed.

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

CANDIDATE PROFILE (what they actually did):
${JSON.stringify(profile)}

Return JSON:
{
  "score": <1-10 integer — apply the hard caps above>,
  "strongestThread": "<one sentence: the single most relevant thing they have actually done, not a skill they listed>",
  "biggestGap": "<one sentence: the most important must-have competency the job requires that the candidate has zero direct evidence for>",
  "honestTake": "<2-3 sentences: blunt hiring-manager read — what's real, what's missing, realistic odds>",
  "skillsGap": [
    {
      "skill": "<specific skill or experience to develop, e.g. 'Salesforce CRM'>",
      "effort": "<days | weeks | months | years>",
      "path": "<one sentence: the most direct way to actually get this — free resources, certs, job types>"
    }
  ]
}
Only include skillsGap if score < 7. List 2-3 items max, ordered by leverage (most impactful to the score first). Be specific and actionable — not generic advice like "get more experience".`;

      try {
        const fitCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: fitPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        });
        fitAssessment = JSON.parse(fitCompletion.choices[0].message.content || '{}');
      } catch {
        // non-fatal
      }
    }

    return NextResponse.json({ jobAttributes, recommendations, fitAssessment });

  } catch (error) {
    console.error('Job description analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze job description' },
      { status: 500 }
    );
  }
}
