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
    const { profileData } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile data is required' },
        { status: 400 }
      );
    }

    const prompt = `Analyze this candidate's profile and generate a comprehensive, well-organized skills section.

CANDIDATE PROFILE:
${JSON.stringify(profileData, null, 2)}

Generate a skills section with 3-5 relevant categories. Each category should group related skills together.

INSTRUCTIONS:
1. Review ALL experiences, projects, and leadership roles
2. Extract both explicit skills (mentioned directly) and implicit skills (demonstrated through work)
3. Organize skills into logical, role-relevant categories
4. Use descriptive category names that help with scanning (e.g., "Product + Strategy", "Technical Tools", "Finance + Analysis")
5. Include 3-6 specific skills per category
6. Prioritize concrete, demonstrable skills over generic soft skills
7. Avoid generic skills like "Communication", "Problem Solving", "Teamwork" unless they're highly specific

CATEGORY NAMING EXAMPLES:
- "Product + Strategy" (for PM/product roles)
- "Customer + Sales" (for client-facing roles)
- "Finance + Analysis" (for finance/analytical roles)
- "Technical Tools" (for software/tools)
- "Data + Analytics" (for data-focused skills)
- "Operations + Process" (for operational skills)
- "Leadership + Management" (for management skills)

SKILL EXTRACTION RULES:
- Technical tools/software → "Technical Tools" category
- Product/strategy work → "Product + Strategy" category
- Customer/sales work → "Customer + Sales" category
- Financial analysis → "Finance + Analysis" category
- Data work → "Data + Analytics" category
- Process improvement → "Operations + Process" category

Return VALID JSON with this structure:
{
  "skills": [
    {
      "category": "string - descriptive category name",
      "items": ["array of 3-6 specific skills in this category"]
    }
  ],
  "reasoning": "Brief explanation of why these categories and skills were selected"
}

EXAMPLES:

For a PM/Product candidate:
{
  "skills": [
    {
      "category": "Product + Strategy",
      "items": ["Customer Discovery", "Feature Prioritization", "Product Roadmapping", "User Research", "Market Analysis"]
    },
    {
      "category": "Technical Tools",
      "items": ["Figma", "Jira", "SQL", "Excel", "Google Analytics"]
    },
    {
      "category": "Data + Analytics",
      "items": ["A/B Testing", "Metrics Definition", "Data-Driven Decision Making", "User Behavior Analysis"]
    }
  ]
}

For a Finance candidate:
{
  "skills": [
    {
      "category": "Finance + Analysis",
      "items": ["Financial Modeling", "Risk Assessment", "Credit Evaluation", "Budget Management", "Variance Analysis"]
    },
    {
      "category": "Technical Tools",
      "items": ["Excel", "Bloomberg Terminal", "SAP", "Power BI", "SQL"]
    },
    {
      "category": "Operations + Process",
      "items": ["Process Optimization", "Compliance Management", "Audit Coordination", "Reporting"]
    }
  ]
}

Be thorough and strategic. Extract skills that demonstrate real capabilities.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a career consultant specializing in skills assessment. Extract and organize skills from candidate profiles. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    const generatedSkills = JSON.parse(result);

    return NextResponse.json(generatedSkills);

  } catch (error) {
    console.error('Skill generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate skills' },
      { status: 500 }
    );
  }
}
