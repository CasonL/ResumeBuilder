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
        experiences: (masterData.experiences || []).map((e: any) => `${e.role} at ${e.company}: ${(e.bullets || []).slice(0, 2).join('; ')}`),
        leadership: (masterData.leadership || []).map((l: any) => `${l.role} at ${l.company}: ${(l.bullets || []).slice(0, 1).join('; ')}`),
        skills: (masterData.skills || []).flatMap((s: any) => s.items || []).slice(0, 15),
      };

      const fitPrompt = `Score how well this candidate fits this job. Be blunt — 1 is a long shot, 10 is a direct match.

JOB DESCRIPTION:
${jobDescription.slice(0, 1500)}

CANDIDATE PROFILE:
${JSON.stringify(profile)}

Return JSON:
{
  "score": <1-10 integer>,
  "strongestThread": "<one sentence: the single most relevant thing they have>",
  "biggestGap": "<one sentence: the most important thing the job demands they don't have>",
  "honestTake": "<2 sentences max: blunt hiring-manager read>"
}`;

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
