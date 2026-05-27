import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import OpenAI from 'openai';
import mammoth from 'mammoth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test endpoint to verify route is accessible
export async function GET() {
  return NextResponse.json({ status: 'Upload endpoint is accessible' });
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  
  // PDF files are handled client-side, so they shouldn't reach this endpoint
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    throw new Error(
      'PDF files should be processed client-side. This is a server configuration error.'
    );
  }
  
  // Handle DOCX files
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  
  // Handle plain text files
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return await file.text();
  }
  
  // DOC files (older Word format)
  if (file.type === 'application/msword' || file.name.endsWith('.doc')) {
    throw new Error('Legacy .doc files are not supported. Please save as .docx or use the text paste option.');
  }
  
  throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
}

export async function POST(request: NextRequest) {
  console.log('[Upload Resume] POST handler called');
  
  try {
    console.log('[Upload Resume] Starting upload process');
    
    let user;
    try {
      user = await getCurrentUser();
      console.log('[Upload Resume] User authenticated:', user ? user.id : 'none');
    } catch (authError) {
      console.error('[Upload Resume] Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication failed', details: authError instanceof Error ? authError.message : 'Unknown auth error' },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error('[Upload Resume] No authenticated user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Upload Resume] OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('[Upload Resume] Parsing form data');
    const formData = await request.formData();
    const file = formData.get('resume') as File;
    
    console.log('[Upload Resume] File received:', file ? `${file.name} (${file.type})` : 'none');
    
    if (!file) {
      console.error('[Upload Resume] No file in form data');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Extract text from the uploaded file
    console.log('[Upload Resume] Extracting text from file');
    let fileText: string;
    try {
      fileText = await extractTextFromFile(file);
      console.log('[Upload Resume] Text extracted, length:', fileText.length);
    } catch (extractError) {
      console.error('[Upload Resume] Text extraction failed:', extractError);
      return NextResponse.json(
        { error: extractError instanceof Error ? extractError.message : 'Failed to extract text from file' },
        { status: 400 }
      );
    }

    if (!fileText.trim()) {
      console.error('[Upload Resume] Extracted text is empty');
      return NextResponse.json(
        { error: 'No text could be extracted from the file' },
        { status: 400 }
      );
    }
    
    console.log('[Upload Resume] Starting AI parsing (2 passes)');

    const firstPassPrompt = `You are an expert resume parser. This is PASS 1 of 2 - focus on extracting ALL information comprehensively.

RESUME TEXT:
${fileText}

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
    "linkedin": "linkedin url or username"
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
  ]
}

If leadership roles are mixed with work experience, separate them appropriately. Generate logical IDs in kebab-case format.`;

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
${fileText}

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
