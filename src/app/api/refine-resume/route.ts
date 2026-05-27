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
    const { jobDescription, resumeContent, masterData, critique } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!jobDescription || !resumeContent || !masterData || !critique) {
      return NextResponse.json(
        { error: 'Job description, resume content, master data, and critique are required' },
        { status: 400 }
      );
    }

    const refinementPrompt = `You are a resume expert. Apply the critique feedback to improve this resume WITHOUT adding placeholders or buzzword inflation.

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME CONTENT:
${JSON.stringify(resumeContent, null, 2)}

USER'S MASTER DATA:
${JSON.stringify(masterData, null, 2)}

CRITIQUE FEEDBACK:
${JSON.stringify(critique, null, 2)}

Your task: Apply the critique to create a MORE CREDIBLE version of the resume.

CRITICAL RULES - NEVER VIOLATE:

1. **NEVER ADD PLACEHOLDERS**
   - NO "[X]%", NO "[metric]", NO "[outcome]"
   - If master data doesn't have a specific metric, keep it qualitative or don't add it
   - Better to be specific without numbers than vague with placeholders

2. **PRESERVE CONCRETE LANGUAGE**
   - If original bullet is specific and differentiated, keep that specificity
   - "60+ customer conversations" is BETTER than "extensive customer research"
   - "Scenario-based assessments" is BETTER than "performance evaluation tools"
   - Don't trade concrete nouns for abstract buzzwords

3. **AVOID BUZZWORD INFLATION**
   - Only add keywords that genuinely fit and the master data supports
   - "Led product discovery" ONLY if master data shows discovery work
   - "Data-driven" ONLY if master data shows actual measurement/metrics
   - When in doubt, keep original phrasing

4. **CREDIBILITY > OPTIMIZATION**
   - A plain, specific bullet is better than a keyword-stuffed generic one
   - If critique suggests something master data can't support, DON'T add it
   - Prefer reframing over adding new claims

WHEN TO MAKE CHANGES (high confidence only):

✓ Update education focus if critique suggests better role alignment
✓ Replace truly generic skills (Excel, Teams) with role behaviors IF master data supports
✓ Reframe technical language as product language IF master data shows product thinking
✓ Add artifacts/deliverables IF explicitly mentioned in master data
✓ Strengthen verbs (managed → designed, led → architected) IF role context supports

WHEN TO KEEP ORIGINAL (preserve specificity):

✓ Keep specific numbers, conversations, team sizes, timeframes
✓ Keep concrete project/feature names
✓ Keep differentiated language ("scenario-based", "multi-agent", specific tools)
✓ Keep bullets that are already strong and credible

APPLYING CRITIQUE:

If critique says: "Missing metrics in PitchIQ"
And master data has: customer conversations, iterations, but NO activation rates
GOOD: "Built and iterated AI roleplay product through 60+ customer interviews and weekly refinement cycles"
BAD: "Built AI product, increasing user engagement by [X]%"

If critique says: "Skills too generic"
And master data shows: customer interviews, product iterations, prioritization
GOOD: Replace ["Excel", "PowerPoint"] → ["Customer discovery", "Product prioritization", "Iterative development"]
BAD: Replace → ["Data-driven decision making", "Strategic thinking", "Outcome measurement"] (unless master data proves these)

If critique says: "Top section needs PM hook"
GOOD: Update educationFocus to "Product Strategy & Systems Thinking"
BAD: "Data-Driven Product Strategy & Metrics" (if no metrics in experience)

Return VALID JSON with the SAME structure as the original resume content, but with CREDIBLE improvements:
{
  "resumeName": "string",
  "selectedExperiences": ["same IDs as input"],
  "selectedLeadership": ["same IDs as input"],
  "selectedProjects": ["same IDs as input"],
  "selectedSkills": ["improved skills - concrete behaviors only"],
  "tailoringNotes": {
    "keywords": ["updated based on critique"],
    "strengths": ["updated based on critique"],
    "recommendations": ["keep existing or enhance"],
    "warnings": ["keep existing"]
  },
  "customizations": {
    "educationFocus": "string - role-appropriate without false claims",
    "bulletPointAdjustments": {
      "experience-id": ["IMPROVED bullets - specific and credible, NO PLACEHOLDERS"]
    }
  },
  "refinementApplied": {
    "changesCount": number,
    "majorImprovements": ["list of 3-5 key changes made"],
    "critiqueAddressed": ["list of critique points that were applied"],
    "preservedSpecificity": ["list of 2-3 concrete details from original that were kept"]
  }
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume consultant who applies feedback systematically and precisely. Return valid JSON only.'
        },
        {
          role: 'user',
          content: refinementPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    const refinedResume = JSON.parse(result);

    return NextResponse.json({
      success: true,
      data: refinedResume,
    });

  } catch (error) {
    console.error('Resume refinement error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to refine resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
