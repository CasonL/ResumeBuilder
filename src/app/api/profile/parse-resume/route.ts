import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { resumeText } = await request.json();
    
    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    const firstPassPrompt = `You are an expert resume parser. This is PASS 1 of 2 - focus on extracting ALL information comprehensively.

RESUME TEXT:
${resumeText}

CRITICAL RULES FOR EXTRACTION:
- Extract ALL numerical data EXACTLY as written (dollar amounts, percentages, dates, team sizes)
- Keep ALL company names, role titles, certifications EXACTLY as spelled
- Preserve ALL bullet points under each experience - do NOT summarize
- Extract ALL skills mentioned
- Do NOT skip any information
- Do NOT modify or paraphrase - use exact text from resume

Return VALID JSON with this EXACT structure:
{
  "personalInfo": {
    "name": "full name",
    "pronouns": "he/him or she/her if mentioned, otherwise empty string",
    "location": "city, state/province",
    "email": "email address",
    "phone": "phone number",
    "linkedin": "linkedin url or username",
    "summary": "professional summary or objective statement if present on resume, otherwise empty string"
  },
  "education": {
    "degree": "degree name",
    "institution": "university/college name",
    "dates": "graduation year or expected year",
    "focus": "major or focus area",
    "coursework": ["relevant course 1", "relevant course 2"]
  },
  "experiences": [
    {
      "id": "generate-a-kebab-case-id",
      "role": "job title",
      "company": "company name",
      "dates": "date range exactly as written",
      "bullets": ["bullet point 1", "bullet point 2", "..."],
      "tags": ["skill1", "skill2", "..."]
    }
  ],
  "leadership": [
    {
      "id": "generate-a-kebab-case-id",
      "role": "leadership role",
      "company": "organization name",
      "dates": "date range",
      "bullets": ["achievement 1", "achievement 2"],
      "tags": ["leadership", "skill1", "..."]
    }
  ],
  "projects": [
    {
      "id": "generate-a-kebab-case-id",
      "title": "project name",
      "description": "brief description",
      "bullets": ["detail 1", "detail 2"],
      "tags": ["technology1", "technology2"]
    }
  ],
  "skills": [
    {
      "category": "category name (e.g., 'Technical Skills', 'Tools', 'Core Strengths')",
      "items": ["skill 1", "skill 2", "..."]
    }
  ],
  "certifications": [
    {
      "name": "certification name",
      "details": "issuing organization or date if mentioned"
    }
  ],
  "achievements": [
    {
      "title": "achievement or award name",
      "description": "brief description or context",
      "date": "date or year if mentioned"
    }
  ],
  "hobbies": ["hobby 1", "hobby 2", "..."]
}

If leadership roles are mixed with work experience, separate them appropriately. Generate logical IDs in kebab-case format. Include hobbies/interests if mentioned. Include any notable achievements or awards.`;

    const firstPass = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a precise resume parser on PASS 1. Extract ALL information comprehensively. Return only valid JSON.'
        },
        {
          role: 'user',
          content: firstPassPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const firstPassResult = firstPass.choices[0].message.content;
    if (!firstPassResult) {
      throw new Error('No response from first pass');
    }

    const firstPassData = JSON.parse(firstPassResult);

    const secondPassPrompt = `You are validating resume data extraction. This is PASS 2 of 2 - verify accuracy and correct any errors.

ORIGINAL RESUME TEXT:
${resumeText}

EXTRACTED DATA FROM PASS 1:
${JSON.stringify(firstPassData, null, 2)}

VALIDATION TASKS:
1. Verify ALL numbers match the resume EXACTLY (dollar amounts, percentages, dates, team sizes)
2. Check company names, role titles are spelled correctly
3. Ensure bullets are assigned to the correct experience/role
4. Confirm no data was skipped or misplaced
5. Fix any errors found

CRITICAL RULES:
- If a number/stat is assigned to wrong experience, move it to the correct one
- Keep ALL data from pass 1, just fix placement/accuracy
- Do NOT add new information not in the resume
- Do NOT remove information that exists in the resume

Return the CORRECTED JSON in the same structure. Only fix errors - keep everything else identical.`;

    const secondPass = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are validating extracted resume data on PASS 2. Fix any errors while preserving all information. Return only valid JSON.'
        },
        {
          role: 'user',
          content: secondPassPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const secondPassResult = secondPass.choices[0].message.content;
    if (!secondPassResult) {
      throw new Error('No response from second pass');
    }

    const validatedProfile = JSON.parse(secondPassResult);

    return NextResponse.json({
      success: true,
      profile: validatedProfile,
      requiresConfirmation: true
    });

  } catch (error) {
    console.error('Resume parsing error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Failed to parse resume',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
