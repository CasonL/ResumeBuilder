import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth-helpers';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { careerGoalsText, existingProfile } = await req.json();

    if (!careerGoalsText || typeof careerGoalsText !== 'string') {
      return NextResponse.json({ error: 'Career goals text is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('[Parse Career Goals] Parsing career goals text with AI');

    const prompt = `You are an expert at extracting structured information from career narratives and personal context.

EXISTING PROFILE DATA (DO NOT DUPLICATE):
${JSON.stringify(existingProfile, null, 2)}

CAREER GOALS TEXT TO PARSE:
${careerGoalsText}

Your task: Extract ALL relevant information from the career goals text that is NOT already in the existing profile. Be COMPREHENSIVE and DETAILED. Look for:

1. **Experiences**: Any mention of jobs, roles, internships, or work - even if briefly mentioned
2. **Leadership**: Founding companies, leading teams, managing people, club leadership, etc.
3. **Projects**: Products built, side projects, hackathons, research, coursework projects
4. **Skills**: Technical skills, tools, languages, frameworks, soft skills mentioned or implied
5. **Education**: Schools, degrees, programs, courses, bootcamps
6. **Certifications**: Any credentials, certificates, or professional qualifications
7. **Achievements**: Metrics, awards, recognition, quantifiable results

Return in this JSON format:

{
  "experiences": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "dates": "Infer from context or use 'Present' if current, or leave empty if unknown",
      "bullets": [
        "Extract every achievement, responsibility, or detail mentioned",
        "Include metrics and numbers",
        "Capture the impact and scope"
      ]
    }
  ],
  "leadership": [
    {
      "role": "Leadership Role (e.g., Founder, Team Lead, President)",
      "company": "Organization or Company",
      "dates": "Infer or leave empty",
      "bullets": ["All leadership achievements and responsibilities"]
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "Detailed description of what it is/does",
      "bullets": [
        "Key features, technologies, achievements",
        "Impact, users, metrics if mentioned"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree or Program",
      "school": "Institution Name",
      "year": "Year or 'Expected YYYY' or empty",
      "details": "GPA, honors, relevant details"
    }
  ],
  "skills": [
    "Extract ALL skills mentioned or strongly implied",
    "Include technical skills, tools, frameworks, languages",
    "Include soft skills like 'product thinking', 'user research', 'data analysis'",
    "Include domain expertise like 'fintech', 'AI/ML', 'sales'"
  ],
  "certifications": ["Any credentials or certifications mentioned"]
}

EXTRACTION RULES:
- Be AGGRESSIVE about extracting information - capture everything relevant
- If something is mentioned even briefly, extract it with as much detail as possible
- Infer reasonable details from context (e.g., if they say "I founded X", that's a leadership role)
- For skills, include both explicitly stated AND strongly implied skills
- Include metrics, numbers, and quantifiable achievements
- If dates aren't mentioned, leave empty or infer from context clues
- Compare with existing profile to avoid exact duplicates, but extract if there are new details
- Return valid JSON only`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at comprehensive information extraction. Be aggressive and thorough - extract ALL relevant details, achievements, skills, and experiences mentioned or implied in the text. Avoid duplicating existing profile data, but capture everything new. Return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const extractedData = JSON.parse(response.choices[0].message.content || '{}');
    console.log('[Parse Career Goals] Extracted data:', extractedData);

    return NextResponse.json({ extractedData });
  } catch (error) {
    console.error('[Parse Career Goals] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse career goals' },
      { status: 500 }
    );
  }
}
