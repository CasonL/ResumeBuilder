import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth-helpers';
import { hasCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import { createClient } from '@/lib/supabase/server';
import { decryptData, getEncryptionKey } from '@/lib/encryption';

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

    const { jobDescription, preferences } = await request.json();

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

    // Check if user has enough credits
    const hasEnoughCredits = await hasCredits(user.id, CREDIT_COSTS.RESUME_GENERATION);
    if (!hasEnoughCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please purchase more credits to generate a resume.' },
        { status: 402 } // Payment Required
      );
    }

    const defaultPreferences = {
      targetLength: '1-page',
      layoutStyle: 'balanced-columns',
      prioritySections: [],
      tone: 'professional',
      includeAchievements: true,
    };

    const userPrefs = { ...defaultPreferences, ...preferences };

    // Get user's encrypted profile from database
    const supabase = await createClient();
    const encryptionKey = getEncryptionKey();
    
    const { data: profileRecord, error: profileError } = await supabase
      .from('profiles')
      .select('encrypted_data')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profileRecord) {
      return NextResponse.json(
        { error: 'Profile not found. Please upload your resume in the Profile section first.' },
        { status: 404 }
      );
    }

    // Decrypt profile data
    const masterData = decryptData(profileRecord.encrypted_data, encryptionKey);
    const personalContext = masterData.personalContext || '';

    const layoutGuidance: Record<string, string> = {
      'balanced-columns': 'Create a BALANCED 2-column layout. Main content (left) should include Experience, Leadership, Projects. Sidebar (right) should have Skills, Certifications. ENSURE both columns are roughly equal length - avoid one column being much longer than the other.',
      'content-heavy': 'Prioritize main content section with detailed experiences and achievements. Minimize sidebar to only essential skills and certs - keep it compact.',
      'sidebar-focus': 'Make the sidebar prominent with comprehensive skills breakdown, all certifications, and achievements. Main content should be concise but impactful.',
    };

    const toneGuidance: Record<string, string> = {
      'professional': 'Use traditional corporate language, focus on metrics and business impact, formal tone',
      'creative': 'Use dynamic action verbs, emphasize innovation and creative problem-solving, engaging tone',
      'technical': 'Emphasize technical skills and tools, include specific technologies, precise technical language',
    };

    const priorityGuidance = userPrefs.prioritySections.length > 0 
      ? `\nPRIORITY SECTIONS (give these extra attention and space): ${userPrefs.prioritySections.join(', ')}`
      : '';

    const prompt = `You are an expert resume consultant. Analyze the job description thoroughly and create a strategic, tailored resume using ALL available candidate data.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S COMPLETE MASTER DATA:
${JSON.stringify(masterData, null, 2)}

USER PREFERENCES:
- Target Length: ${userPrefs.targetLength}
- Layout Style: ${userPrefs.layoutStyle} - ${layoutGuidance[userPrefs.layoutStyle]}
- Tone: ${userPrefs.tone} - ${toneGuidance[userPrefs.tone]}${priorityGuidance}
- Include Achievements: ${userPrefs.includeAchievements ? 'Yes' : 'No'}

STRICT CONTENT SELECTION RULES - MUST FOLLOW:

**LENGTH REQUIREMENTS (${userPrefs.targetLength}):**
${userPrefs.targetLength === '1-page' ? `
- Select 3-4 experiences (prioritize 3 if available - experiences are the MOST IMPORTANT section)
- Each experience gets 2-3 bullet points
- Select 1-2 leadership roles maximum
- Select 1 project maximum (only if highly relevant)
- Select 8-10 skills total
- PRIORITY: Allocate space to experiences first, then other sections
` : `
- Select 4-6 experiences (can be more comprehensive)
- Each experience gets 3-4 bullet points (more detail)
- Select 2-4 leadership roles
- Select 2-3 projects
- Select 10-12 skills total
`}

**LAYOUT REQUIREMENTS (${userPrefs.layoutStyle}):**
${userPrefs.layoutStyle === 'balanced-columns' ? `
- Main content: experiences, leadership, projects
- Sidebar: skills, certifications, achievements
- BALANCE: Don't overload main column - distribute content evenly
` : userPrefs.layoutStyle === 'content-heavy' ? `
- Prioritize detailed experiences and projects in main content
- Keep sidebar minimal (only top 6-8 skills, essential certs)
- Focus on comprehensive work history
` : `
- Make sidebar prominent with full skills breakdown
- Main content should be concise but impactful
- Include all certifications and achievements in sidebar
`}

**TONE REQUIREMENTS (${userPrefs.tone}):**
- Apply ${toneGuidance[userPrefs.tone]} to ALL bullet point rewrites

**PRIORITY SECTIONS:**
${priorityGuidance || '- No specific priority sections selected'}

INSTRUCTIONS - FOLLOW IN ORDER:
1. ANALYZE the job description deeply - identify required skills, experiences, keywords, and cultural fit indicators
2. IDENTIFY 5-8 powerful keywords from job description that could strengthen bullet points
3. REVIEW ALL experiences, projects, leadership roles, and skills in the master data
4. SELECT content STRICTLY following the length limits above
   **CRITICAL FOR SELECTION: PRIORITIZE RELEVANCE OVER RECENCY - READ THIS CAREFULLY**
   
   **MANDATORY INCLUSION RULES (OVERRIDE ALL OTHER CONSIDERATIONS):**
   - For PM/Product roles: MUST include ANY experience involving: product development, startup/founder work, customer discovery, feature prioritization, user research, product decisions
   - For PM/Product roles: MUST include ANY projects involving: building products, AI/tech prototypes, customer-facing tools
   - These are MORE important than recent retail/service jobs, even if those jobs are more recent
   
   **EXPLICIT EXAMPLES - FOLLOW THESE PATTERNS:**
   
   For PM role with candidate who has:
   - "Founder, PitchIQ (AI product)" 
   - "Franchisee, College Pro (sales/operations)"
   - "Supervisor, Donut Shop (retail)"
   
   ✅ CORRECT Selection: PitchIQ, College Pro, Donut Shop (in that order - product experience FIRST)
   ❌ WRONG Selection: College Pro, Donut Shop only (missing most relevant PM experience!)
   
   For PM role with candidate who has product/startup experience:
   - ALWAYS include the product/startup experience in position 1 or 2
   - It is THE MOST RELEVANT experience for the role
   - Recent retail/service jobs are SECONDARY even if they're more recent
   
   **RECENCY IS SECONDARY TO ROLE MATCH:**
   - "Built AI product 2 years ago" > "Managed donut shop last year" for PM roles
   - Choose experiences that prove the candidate can DO THE JOB, not just that they've been employed recently
5. **REWRITE BULLETS STRATEGICALLY** - quality over keyword density:
   - If a bullet is already strong and relevant, keep it or make MINIMAL changes
   - Only rewrite when keywords genuinely add meaning or clarity
   - NEVER inflate bullets with buzzwords - keep them punchy and specific
   - Frame experiences naturally using job description terminology
   - Avoid corporate-speak bloat: "led cross-functional recruiting and marketing initiatives, identifying program enhancement opportunities" ❌
   - Prefer tight, impactful language: "translated customer insights into product requirements" ✓
6. PROVIDE specific, transformational recommendations (NOT generic career advice)

CRITICAL RULES - NEVER VIOLATE:
- NEVER change numbers: keep dollar amounts, percentages, dates, team sizes EXACTLY as written
- NEVER change names: companies, certifications, people, places must be EXACT
- NEVER fabricate data: only use information from the master data
- NEVER modify dates or timeframes
- When tailoring bullets, only REFRAME and EMPHASIZE - don't change facts

IMPORTANT:
- Review the FULL master data - don't skip items
- Consider leadership roles separately from experiences
- Match skills to job requirements explicitly
- Rewrite bullets to emphasize outcomes over tasks, but preserve all factual details
- Be strategic: quality > quantity

Return VALID JSON with this exact structure:
{
  "resumeName": "string (Company - Role format, e.g., 'Neo Financial - Future Product Manager')",
  "selectedExperiences": ["array of experience IDs from masterData.experiences"],
  "selectedLeadership": ["array of leadership IDs from masterData.leadership"],
  "selectedProjects": ["array of project IDs from masterData.projects"],
  "selectedSkills": [
    {
      "category": "string - descriptive category name (e.g., 'Product + Strategy', 'Finance + Analysis', 'Technical Tools')",
      "items": ["array of 2-5 specific skills in this category"]
    }
  ],
  "tailoringNotes": {
    "keywords": ["5-8 powerful keywords from job description that YOU HAVE INCORPORATED into the bullet points"],
    "strengths": ["3-5 specific strengths from candidate's profile that YOU HAVE EMPHASIZED in the bullets"],
    "recommendations": [
      "3-5 SPECIFIC, TRANSFORMATIONAL suggestions with BEFORE/AFTER examples for cover letter and interview prep",
      "Format: 'For [specific situation]: [concrete action with example]'",
      "Use role-specific language (PM: prioritization/tradeoffs, Sales: pipeline/conversion, Eng: architecture/scalability)",
      "Example: 'In cover letter, reframe your startup experience: Instead of \"Built AI prototype\" → \"Translated 60+ customer conversations into product requirements, feature prioritization, and positioning decisions\" - this codes as PM decision-making, not just execution'",
      "NO generic advice like 'showcase adaptability' - give SPECIFIC tactical upgrades"
    ],
    "warnings": ["any gaps, concerns, or areas where candidate might be weak - be honest and specific"]
  },
  "customizations": {
    "educationFocus": "string - tailored focus area matching the role (e.g., 'Product Management & Strategic Thinking')",
    "bulletPointAdjustments": {
      "experience-or-leadership-id": ["array of REWRITTEN bullet points that NATURALLY INCORPORATE the identified keywords and frame achievements to highlight the identified strengths"]
    }
  }
}

CRITICAL FOR BULLET POINT REWRITES - READ CAREFULLY:

**QUALITY OVER KEYWORD DENSITY:**
- Keywords must be integrated NATURALLY - if they don't fit smoothly, reframe the entire bullet
- Punchy, specific bullets > wordy, buzzword-stuffed bullets
- NEVER inflate bullets just to add keywords - keep them tight and impactful
- If original bullet is already strong, minimal changes are better than over-editing

**MANDATORY CREDIBILITY RULES - NO EXCEPTIONS:**

1. **NO FLUFFY LANGUAGE - BE CONCRETE:**
   ❌ BAD: "Customer-Centric Innovation", "Strategic Leadership", "Results-Driven"
   ✓ GOOD: "Product Strategy | Systems Thinking | 0→1 Execution"
   - Avoid poster language and corporate buzzwords
   - Use specific, mechanistic descriptors

2. **CLAIMS REQUIRE MECHANISMS - SHOW HOW:**
   ❌ BAD: "enhanced training effectiveness" (how do you know?)
   ❌ BAD: "increased customer satisfaction" (what changed?)
   ✓ GOOD: "reduced onboarding time from 2 weeks to 3 days"
   ✓ GOOD: "increased repeat session rate from X% to Y%"
   - If no metrics available, describe WHAT YOU DID, not vague outcomes
   - Examples of concrete mechanisms: completion rate, conversion rate, cycle time, response time, sessions/week

3. **GROWTH CLAIMS MUST USE X→Y FORMAT:**
   ❌ BAD: "Expanded membership by 450%" (sounds made up)
   ✓ GOOD: "Grew active membership from 20 to 90+ members (+450%)"
   ❌ BAD: "Secured significant funding"
   ✓ GOOD: "Secured $1,000+ in sponsorship from 3 companies"
   - X→Y format makes claims defensible and concrete

4. **REMOVE SELF-CONGRATULATORY FILLER:**
   ❌ BAD: "showcasing leadership and community-building skills"
   ❌ BAD: "demonstrating strategic thinking and adaptability"
   - Let the bullet speak for itself - don't add "showcasing X" or "demonstrating Y"

5. **TECHNICAL DESCRIPTIONS MUST BE CONCRETE:**
   ❌ BAD: "Self-taught technical architecture to design AI-driven systems"
   ✓ GOOD: "Self-taught technical architecture to design prompt + workflow systems (routing, evaluation, branching)"
   - Name specific system components: prompt flows, evaluation logic, scoring, branching, routing

6. **EDUCATION FOCUS - AVOID FLUFFY TITLES:**
   ❌ BAD: "Product Management & Customer-Centric Innovation"
   ✓ GOOD: "Product Strategy & Data-Driven Decision Making"
   ✓ GOOD: "Strategic Product Development & Customer Insight Integration"
   - Use concrete skill descriptors, not aspirational buzzwords

**EXAMPLES OF BAD VS GOOD KEYWORD INTEGRATION:**

BAD (keyword stuffing):
* Original: "Surpassed $42K+ in sales; nominated for Manager of the Year"
* Keywords: "cross-functional", "strategic problem-solving"  
* BAD Rewrite: "Surpassed $42K+ in sales by leading cross-functional recruiting and marketing, achieving Manager of the Year nomination through strategic problem-solving"
* Why bad: Bloated, buzzword soup, lost impact

GOOD (natural integration):
* Original: "Conducted 60+ customer conversations with target users"
* Keywords: "product requirements", "prioritization"
* GOOD Rewrite: "Translated 60+ customer conversations into product requirements and feature prioritization decisions"
* Why good: Natural, punchy, keywords add meaning

**RULES:**
- Incorporate keywords ONLY where they add genuine meaning
- If a bullet is already strong and relevant, minor tweaks or even NO changes are acceptable
- Frame bullets to showcase the strengths you identified
- Use job description terminology naturally, not forced
- Keep all facts/numbers identical to master data
- Shorter, punchier bullets > longer, keyword-dense bullets

CRITICAL FOR RECOMMENDATIONS (COVER LETTER & INTERVIEW):
- Provide 3-5 SPECIFIC, TRANSFORMATIONAL suggestions with concrete before/after examples
- Use role-specific language that matches the target role:
  * PM roles: prioritization, tradeoffs, user insights, product vision, iteration, decision-making
  * Sales roles: pipeline management, conversion optimization, relationship building, quota attainment
  * Engineering roles: architecture, scalability, technical complexity, system design
  * Operations roles: process optimization, efficiency gains, bottleneck elimination
- Format each recommendation clearly:
  * "In [context]: Reframe [specific experience] from [weak framing] to [strong framing with role-coded language]"
  * Example: "In cover letter: Reframe startup work from 'Built AI prototype and tested with users' to 'Translated 60+ customer conversations into product requirements, feature prioritization, and positioning decisions - demonstrating end-to-end product ownership from discovery to execution'"
- Identify the candidate's STRONGEST LEVERAGE (most relevant experience for this role) and show how to emphasize it
- NO generic advice like "showcase adaptability" or "highlight strategic thinking" - give SPECIFIC tactical upgrades
- Focus on artifact-level transformation: what exact phrases to use, what framing to change

**ROLE-SPECIFIC FRAMING (CRITICAL FOR PM/PRODUCT ROLES):**

When candidate has technical/builder background and role is Product Manager/Product-focused:
- Technical fluency is an ASSET, not a liability - frame it as enabler for better product decisions
- Reframe "built/coded/implemented" → "architected/prototyped/designed" with emphasis on product outcomes
- Show technical work as means to product insight, not end goal
- Position as "I understand constraints and can prototype to validate" not "I want to be the engineer"

EXAMPLES for PM roles:
❌ "Self-taught technical architecture to build AI systems" → Sounds like engineer
✓ "Architected multi-agent AI system with hands-on prototyping, enabling rapid iteration and informed technical trade-offs" → Technical fluency as PM asset

❌ "Built AI roleplay prototype" → Pure execution
✓ "Led creation of AI-powered roleplay platform, integrating 60+ customer insights into product development" → Customer→Product translation

✓ "Engineered scenario-based assessments, transforming customer conversations into actionable performance benchmarks" → Technical skill + product thinking

KEY: Emphasize customer insights → product decisions, prototyping → validation, technical understanding → better tradeoffs

IMPORTANT FOR SKILLS:
- Look through ALL skill categories in masterData.skills
- Select 2-4 relevant skill categories based on job requirements
- For each category, select 2-5 specific skills that match the role
- Create descriptive category names that group related skills (e.g., "Product + Strategy", "Finance + Analysis", "Technical Tools")
- Total: 8-15 individual skills across all categories

**SKILLS SELECTION RULES:**
- EXCLUDE generic skills everyone claims: "Communication", "Problem Solving", "Leadership" (unless highly specific to role)
- For PM roles, PRIORITIZE PM mechanics: Customer Discovery, Feature Prioritization, Product Roadmapping, User Research, Cross-functional Collaboration, Iterative Development, Data Analysis
- For technical roles, prioritize specific tools/technologies over soft skills
- Concrete skills > abstract skills
- ❌ AVOID: "Communication", "Problem Solving", "Teamwork", "Adaptability"
- ✓ PREFER: "Customer Discovery", "Prioritization", "Market Analysis", "User Feedback Analysis", "Prototyping"

**CATEGORY NAMING:**
- Use descriptive, role-relevant category names
- Examples: "Product + Strategy", "Customer + Sales", "Finance + Analysis", "Operations + Process", "Technical Tools", "Data + Analytics"
- Categories should make sense together and help recruiters scan quickly

Ensure selectedExperiences uses IDs from masterData.experiences, and selectedLeadership uses IDs from masterData.leadership.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume consultant who provides strategic, honest advice. Return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    const draftResult = JSON.parse(result);

    // PASS 2: Refine recommendations with personal context
    let finalResult = draftResult;
    
    if (personalContext && personalContext.trim()) {
      const refinementPrompt = `You are a senior resume consultant reviewing a draft resume and recommendations. Use the candidate's personal context to provide MORE SPECIFIC, CONTEXT-AWARE recommendations.

CANDIDATE'S PERSONAL CONTEXT:
${personalContext}

JOB DESCRIPTION:
${jobDescription}

DRAFT RESUME DATA:
${JSON.stringify(draftResult, null, 2)}

Your task: Refine the recommendations to be deeply personalized based on the candidate's story, goals, and unique leverage.

CRITICAL INSTRUCTIONS:
1. Keep all the draft resume data EXACTLY as is (selectedExperiences, selectedLeadership, selectedProjects, selectedSkills, customizations)
2. ONLY refine the "recommendations" array in tailoringNotes
3. Use the personal context to identify:
   - The candidate's STRONGEST LEVERAGE (most relevant to this role)
   - Their unique story/angle
   - Specific experiences that need reframing
   - Career goals that should guide messaging

4. Provide 3-5 TRANSFORMATIONAL recommendations with before/after examples that are SPECIFIC TO THIS CANDIDATE
   - Use their actual experiences from the context
   - Show exactly how to reframe based on their goals
   - Use role-specific language matching their target role
   - Focus on their unique leverage

Example of a GOOD recommendation using personal context:
"In cover letter, lead with your PitchIQ work: Instead of 'Founded an AI startup' → 'Designed and built an AI-driven sales training product, translating 60+ customer conversations into core product requirements, feature prioritization, and positioning decisions - demonstrating the product discovery, prioritization, and execution skills Neo seeks in PMs.' This immediately codes you as a product thinker, not just a technical founder."

Return VALID JSON with the SAME structure as the draft, but with refined recommendations:
{
  ...all draft fields unchanged...,
  "tailoringNotes": {
    "keywords": [...keep from draft...],
    "strengths": [...keep from draft...],
    "recommendations": [
      "NEW SPECIFIC recommendations using candidate's personal context and story"
    ],
    "warnings": [...keep from draft...]
  }
}`;

      try {
        const refinementCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a senior resume consultant who provides deeply personalized, context-aware advice. Return valid JSON only.'
            },
            {
              role: 'user',
              content: refinementPrompt
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.6,
        });

        const refinementResult = refinementCompletion.choices[0].message.content;
        if (refinementResult) {
          finalResult = JSON.parse(refinementResult);
        }
      } catch (error) {
        console.error('Refinement pass failed, using draft:', error);
        // If refinement fails, use draft result
      }
    }

    // Deduct credits after successful generation
    const creditResult = await deductCredits(
      user.id,
      CREDIT_COSTS.RESUME_GENERATION,
      'generation',
      `Resume generated for: ${jobDescription.substring(0, 50)}...`
    );

    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error || 'Failed to deduct credits' },
        { status: 500 }
      );
    }

    // Save generated resume to encrypted database
    const { encryptData } = require('@/lib/encryption');
    const encryptedData = encryptData(finalResult, encryptionKey);
    
    // Generate resume name from job description
    const resumeName = jobDescription.split('\n')[0].substring(0, 100) || 'Generated Resume';
    
    const { data: resumeRecord, error: saveError } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        name: resumeName,
        encrypted_data: encryptedData,
        job_description: jobDescription,
        preferences: userPrefs,
      })
      .select()
      .single();

    if (saveError || !resumeRecord) {
      console.error('Failed to save resume:', saveError);
      return NextResponse.json(
        { error: 'Resume generated but failed to save' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      resumeId: resumeRecord.id,
      data: finalResult,
      masterData,
      creditsRemaining: await require('@/lib/credits').getCredits(user.id),
    });

  } catch (error) {
    console.error('Resume generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate resume',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
