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
        projects: (masterData.projects || []).map((p: any) => `${p.name || p.title}: ${(p.bullets || []).join('; ')}`),
        skills: (masterData.skills || []).flatMap((s: any) => s.items || []),
        ...(masterData.websiteContext ? { portfolioContext: masterData.websiteContext } : {}),
      };

      const fitPrompt = `You are an experienced hiring manager evaluating a candidate for a specific role. Your job is to give an accurate, honest fit score — not flattering, not dismissive. This must work fairly for any role type: sales, engineering, operations, healthcare, marketing, product, finance, creative, or anything else.

STEP 1 — READ THE ENVIRONMENT:
Infer what this organization values based on signals in the JD:
- LEAN/SMALL ORG signals: generalist expectations, "wear many hats", small team size implied, bootstrapped, early-stage, "you'll own X end-to-end", informal structure.
- LARGE/STRUCTURED ORG signals: formal credentials required, large teams, established processes, compliance-heavy, enterprise clients, specific certifications or degrees required.
This matters: in a lean org, demonstrated results through ANY path (self-taught, freelance, founder, side project, cross-functional role) count as real experience. In a structured org, formal credentials, specific titles, and process experience matter more.

STEP 2 — IDENTIFY WHAT THE ROLE ACTUALLY REQUIRES:
List the 3-5 CORE competencies this role cannot function without. Be specific — not "communication" but things like "cold outreach + pipeline management", "regulatory filing experience", "managing a team of 5+", "writing production SQL", "diagnosing and treating X condition". Separate these from SECONDARY competencies (nice-to-have, listed but not central).

STEP 3 — EVALUATE THE CANDIDATE HONESTLY:
For each core competency:
- DIRECT: They have literally done this thing, in any context (work, project, freelance, own business, academic).
- TRANSFERABLE: They've done something meaningfully adjacent but not the same.
- No evidence: They have not done this.
Do NOT be fooled by listed skills. "Managed relationships" as a skill is not the same as having a book of accounts. "Leadership" as a skill is not the same as having managed direct reports. Read what they actually DID.

STEP 4 — SCORE:
- All or most core competencies covered with DIRECT evidence → 8–10
- Most cores covered, one gap or one transferable → 6–8 depending on how critical that gap is
- Missing one CORE competency with no direct evidence → cap at 6
- Missing two or more core competencies → cap at 4
- Covering secondary skills does NOT raise the score if core gaps exist.
- Covering almost everything except one secondary skill should NOT drop the score below 7.

STEP 5 — FLAG PRACTICAL BARRIERS:
If the JD requires a specific location, license, certification, or degree and the candidate doesn't have it, note it clearly in the honestTake as a practical barrier. Do not use it to change the score — it's separate from competency fit.

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

CANDIDATE PROFILE (what they actually did):
${JSON.stringify(profile)}

Return JSON only:
{
  "score": <integer 1–10>,
  "strongestThread": "<one sentence: the single most relevant thing they have actually done — specific, not generic>",
  "biggestGap": "<one sentence: the most critical competency the role requires that the candidate has no direct evidence for — or 'No critical gaps identified' if core competencies are covered>",
  "honestTake": "<2-3 sentences: direct hiring-manager read — what genuinely works, what's actually missing, any practical barriers, realistic odds>"
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
