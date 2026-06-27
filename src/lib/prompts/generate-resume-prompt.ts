export function buildGenerateResumePrompt(
  jobDescription: string,
  masterData: any,
  userPrefs: any,
  personalContext: string
): string {
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

  const personalContextBlock = personalContext && personalContext.trim()
    ? `\nCANDIDATE'S PERSONAL CONTEXT (use to inform tone and framing only):\n${personalContext}`
    : '';

  return `You are an expert resume consultant. Read the job description carefully, figure out what the role actually requires, then reframe the candidate's real experiences to prove they can do that specific job.

JOB DESCRIPTION:
${jobDescription}
${personalContextBlock}
CANDIDATE'S COMPLETE MASTER DATA:
${JSON.stringify(masterData, null, 2)}

USER PREFERENCES:
- Target Length: ${userPrefs.targetLength}
- Layout Style: ${userPrefs.layoutStyle} - ${layoutGuidance[userPrefs.layoutStyle]}
- Tone: ${userPrefs.tone} - ${toneGuidance[userPrefs.tone]}${priorityGuidance}
- Include Achievements: ${userPrefs.includeAchievements ? 'Yes' : 'No'}

STEP 0 - FIT ASSESSMENT (do this first, before selecting or framing anything)
- Identify the 3-5 MUST-HAVE competencies the role explicitly requires. These are the things the job cannot function without.
- For each must-have, check if the candidate has DIRECT experience (they literally did that thing in a real role) vs TRANSFERABLE (adjacent but not the same).
- SCORING HARD CAPS: Missing one core must-have → score 6 or below. Missing two or more → score 4 or below. Soft skills can add +1 at most and cannot compensate for missing core competencies.
- Do NOT be fooled by skill keywords the candidate listed. "CRM" as a listed skill is not the same as having done CRM maintenance. "Sales" is not the same as renewal management. Score against what they actually DID.
- Identify the SINGLE STRONGEST THREAD (the one real thing they did that is most relevant) and the SINGLE BIGGEST GAP (the must-have with zero direct evidence).
- Do not rationalize gaps away. Name them clearly.
- Output this as the "fitAssessment" field in the final JSON.

STEP 1 - IDENTIFY THE ROLE TYPE AND CORE COMPETENCIES
- Do NOT assume this is a PM or product role. Infer the actual role from the job description.
- Common roles: HR/People Ops, Executive Operations, Sales, Marketing, Customer Success, Operations, Engineering, Product, Finance, etc.
- Extract the 3-5 core competencies the role requires. These will drive selection and framing.

STEP 1.5 - DETECT HARD REQUIREMENTS AND ASTERISK EXCEPTIONS (CRITICAL)
- HARD REQUIREMENTS: words like "required", "must have", "minimum qualifications", "degree required", "Masters/PhD required", etc. These are gates that auto-filter candidates who do not meet them.
- ASTERISK / EXCEPTION: phrases like "special consideration", "equivalent experience may be considered", "exceptional candidates without...", "applicants with an active...", "strong preference will be given to...", "may substitute for...". These are the real door in when the hard gate is not met.
- If the candidate does NOT clearly meet the hard requirements, but the job description offers an asterisk or alternative path, RE-WEIGHT THE ENTIRE RESUME around the asterisk themes. The resume's job is to prove the candidate is the exact exception the asterisk was written for.
- First, extract the asterisk themes from the job description itself (e.g., "active network of...", "community program experience in...", "equivalent experience in..."). Do NOT assume a fixed set of themes; derive them directly from the posting.
- Then, find the candidate's evidence in masterData that matches those specific themes, and make that evidence the headline of the resume.
- The summary should be framed as the answer to the asterisk, using the exact language of the asterisk, not as a generic "I am qualified for this role" statement.
- If no hard requirements are present, treat the core competencies as the target and proceed normally.

STEP 2 - SELECT CONTENT (RELEVANCE OVER EVERYTHING)
- Select 3-4 experiences for a 1-page resume, 4-6 for longer.
- Select 1-2 leadership roles for 1-page, 2-4 for longer.
- Select projects only if they strongly support the role's core competencies.
- PRIORITIZE experiences that best match the role's core competencies, even if they are not the most recent.
- If relying on an asterisk exception, PRIORITIZE the experience or leadership role that directly proves the asterisk themes extracted from the job description. This should be the STAR of the resume, not a footnote.
- If the asterisk-proof evidence is a leadership role, put it FIRST in selectedLeadership, select fewer leadership items (ideally 1-2) so it is not buried, and give it the strongest bullets. Do not let it become the third item under a leadership heading while less relevant experiences dominate the page.
- Do NOT default to product/startup experience unless the job is for product/startup work.

EXAMPLES - FOLLOW THESE PATTERNS:

For HR/Executive Operations role, a candidate with these roles:
- "Founder, AI Startup (AI product)"
- "Franchisee, Sales/Operations Company (sales/operations)"
- "Supervisor, Retail Operation (retail/operations)"
- "President, University Club (club leadership)"

✅ CORRECT Selection: Sales/Operations Company, Retail Operation, University Club (lead with operational/people evidence)
❌ WRONG Selection: AI Startup first (forces a product-manager framing that doesn't match the role)

For a role with an asterisk exception like "special consideration for applicants with [specific non-degree qualification described in the job description, e.g., an active network, community program experience, etc.]":
- Identify the candidate's evidence in masterData that matches those exact themes. That evidence becomes the resume's headline.
- The summary should lead with the asterisk themes extracted from the job description, not generic role-category language.
- Frame each experience honestly: a startup role should be framed as founder/customer-discovery experience, not stretched into a story it isn't.
- Other experience should be framed as what it actually was without wink language toward the role's requirements.

For any role: choose experiences that prove the candidate can DO THIS JOB, not just that they have been employed.

STEP 3 - REFRAME BULLETS USING THE JOB'S VOCABULARY (LIGHT TOUCH)
- Use the job description's terminology naturally, but do NOT over-tailor. The resume should read like a normal professional resume, not like the job description was pasted into a generator.
- Keep every fact, number, date, company name, and title exactly as in masterData.
- Only reframe emphasis: lead with the part of the experience that matches the target role.
- Avoid corporate bloat. Tight, specific bullets > long, buzzword-heavy bullets.
- Alignment must be implicit through real results and relevant language. NEVER explicitly state the alignment, NEVER name-drop the target company, and NEVER echo the company's mission statement.
- NEVER use "wink" phrases that narrate how an experience is relevant: no "aligning with the role's focus on...", "directly relevant to...", "which mirrors the position's needs...", or similar. Describe what the candidate DID and let the reader draw the connection.
- NEVER stretch an experience into a story it is not. If a role is a sales-training startup, frame it as founder/customer discovery — do not bend it into an unrelated bridge story just because the job mentions a tempting theme.

EXAMPLES - BAD VS GOOD FRAMING:

Bad (generic product framing for HR/ops role):
- "Led development of an AI-driven sales training platform, translating dozens of customer interviews into actionable features."
- Why bad: sells a product-builder identity to an HR/ops role.

Good (same facts, reframed for HR/ops):
- "Coordinated dozens of customer interviews and translated feedback into structured onboarding and training workflows."
- Why good: same facts, but frames coordination, documentation, and process work.

Bad (vague outcome):
- "Enhanced team efficiency through structured training and strategic leadership."

Good (specific mechanism):
- "Trained and coordinated a team of operators, reducing scheduling conflicts through a shared process."

Bad (collapsed evidence into one vague buzzword bullet):
- "Developed an AI-driven platform to solve industry challenges."
- Why bad: one thin sentence replaced three concrete bullets. No mechanism, no numbers, no proof.

Good (preserved evidence density, honest framing):
- "Conducted customer interviews to validate demand and shaped the product around real user workflows."
- "Built scenario-based training modules with a developer, translating sales feedback into usable product features."
- "Managed the product end-to-end: wireframes, prototype testing, and launch planning with zero external funding."
- Why good: three specific, quantified bullets that prove founder/customer-discovery ability without forced framing.

Bad (title inflation):
- "Founder / Strategic Innovator"
- Why bad: "Strategic Innovator" sounds impressive and says nothing.

Good (functional title):
- "Founder / Business Development Lead"
- Why good: names the actual work the person did.

Bad (wink language that narrates relevance):
- "Managed a sales territory through strategic marketing and client-focused approaches, aligning with the role's focus on opportunity identification and program marketing."
- Why bad: the resume is reaching. It tells the reader what to think instead of showing the work.

Good (same facts, no wink):
- "Managed a sales territory: prospected clients, ran marketing campaigns, and closed sales across a season."

Bad (stretching a startup into an unrelated story):
- "Developed AI-driven sales training platform, prioritizing features through customer interviews, enhancing alignment between academic insights and industry needs."
- Why bad: the role is a sales-training startup, not an academic bridge. The framing feels forced.

Good (honest framing that still fits the role):
- "Built an AI-driven sales training platform from customer interviews, validating demand with users and iterating on features as a founder."
- Why good: same facts, but frames the candidate as a founder who does customer discovery and operates in the startup ecosystem.

Bad (burying the asterisk evidence as a club line):
- "President, University Club. Grew active membership through strategic outreach."
- Why bad: framed as a student-club achievement, third-item, under leadership.

Good (asterisk evidence as the headline):
- "Built and grew a community program, expanded membership significantly, and secured sponsorship through targeted outreach to academic and industry partners."
- Why good: reframes the same facts as proof of community-program building and network development — the shape of the asterisk language.

Bad (asterisk evidence buried under three leadership items):
- SelectedLeadership: ["Item A", "Item B", "University Club"]
- Why bad: the most asterisk-relevant item is the third and last. The reader may never reach it.

Good (asterisk evidence foregrounded):
- SelectedLeadership: ["University Club"]
- Why good: one leadership item, first and only, so the proof of the asterisk is impossible to miss.

STEP 4 - GENERATE HEADER, SUMMARY, AND EDUCATION FOCUS
These go inside customizations. They must match the target role, not default to the candidate's product identity.

- customizations.headerTitle: 3-5 pipe-separated keywords in the job's language. Examples:
  - HR/ops role: "Operations | People Coordination | Systems"
  - Sales role: "Sales | Pipeline | Client Relationships"
  - Product role: "Product Strategy | Customer Discovery | Execution"
  - Avoid generic poster words: "Innovation", "Strategic Leadership", "Results-Driven"

- customizations.summary: 2-3 sentence positioning statement that frames who the candidate is and how they operate, NOT a list of what they did and NOT a paraphrase of the company's mission. Use the job's vocabulary for the mechanism, but keep the identity the candidate's own.
  - Lead with the strongest identity: founder, entrepreneur, community builder, operator, etc. Avoid flattening labels like "student" or "graduate" unless the role specifically requires that credential.
  - If the candidate is relying on an asterisk exception, the summary must be shaped as the ANSWER to that asterisk. Lead with the asterisk themes extracted from the job description, not generic role-category language. Use the candidate's own evidence from masterData to support those themes.
  - No pronouns, no name, no self-congratulatory filler, no corporate poster language.
  - Avoid generic claims like "results-driven" or "passionate." Instead, show the underlying instinct: "finds the gap between what exists and what people need — then closes it."
  - Examples of strong positioning statements:
    - "Entrepreneur and community builder with a track record in sales, partnerships, and network growth. Founded a company, ran a customer-facing operation, and built a vibrant community program. Driven by the intersection of people, strategy, and real-world impact."
    - "Operator who builds systems where none exist — from scheduling a team to onboarding workflows that scale. Turns coordination into reliable, repeatable processes."
    - For an asterisk-driven role: "Community builder and entrepreneur with a track record of growing [asterisk theme from job description] and securing sponsorship through targeted outreach."
  - For HR/ops: emphasize coordination, systems, onboarding, documentation, calendar/operations support.
  - For sales: emphasize pipeline, revenue, client relationships, quotas.
  - For product: emphasize customer discovery, prioritization, iteration.
  - For asterisk exceptions: emphasize the themes extracted from the asterisk clause itself.

- customizations.educationFocus: a short, concrete focus tied to the role.
  - HR/ops: "Operations & People Coordination"
  - Sales: "Sales Strategy & Customer Development"
  - Product: "Product Strategy & Data-Driven Decision Making"

Return VALID JSON with this exact structure:
{
  "resumeName": "string (Describes the candidate's ACTUAL background and strongest thread, not the target job title. E.g. if candidate is a founder/operator applying to a CS role, say 'Business Development & Operations' — not 'Customer Success Specialist')",
  "fitAssessment": {
    "score": "number 1–10",
    "strongestThread": "the one real thing the candidate has that maps to this role",
    "biggestGap": "the most important competency the JD demands that the candidate has zero evidence for",
    "honestTake": "2-3 sentence blunt hiring manager perspective — what works, what's a problem, realistic odds",
    "skillsGap": [
      {
        "skill": "specific skill or experience to develop",
        "effort": "days | weeks | months | years",
        "path": "one sentence: most direct way to get this — specific resources, certs, or job types"
      }
    ]
  },
  "selectedExperiences": ["array of experience IDs from masterData.experiences"],
  "selectedLeadership": ["array of leadership IDs from masterData.leadership"],
  "selectedProjects": ["array of project IDs from masterData.projects (only if strongly relevant)"],
  "selectedSkills": [
    {
      "category": "string - descriptive category name (e.g., 'Operations + Process', 'People + Coordination', 'Technical Tools')",
      "items": ["array of 2-5 specific skills in this category"]
    }
  ],
  "tailoringNotes": {
    "keywords": ["5-8 powerful keywords from the job description that you incorporated naturally"],
    "strengths": ["3-5 specific strengths from the candidate's profile that you emphasized"],
    "recommendations": [
      "3-5 SPECIFIC, TRANSFORMATIONAL suggestions with BEFORE/AFTER examples for cover letter and interview prep",
      "Use language that matches the target role, not generic PM language",
      "Example: 'In cover letter: Reframe your sales/operations experience from pure sales achievement to \"Hired, onboarded, and scheduled a seasonal team while running a territory — the same coordination, documentation, and systems mindset needed in an HR coordination and operations role.\"'",
      "NO generic advice like 'showcase adaptability' - give exact phrases to use"
    ],
    "warnings": ["any honest gaps or concerns for this specific role"]
  },
  "customizations": {
    "headerTitle": "role-coded keywords",
    "summary": "2-3 sentences tailored to the job, no pronouns, no name",
    "educationFocus": "concrete role-relevant focus",
    "bulletPointAdjustments": {
      "experience-or-leadership-id": ["rewritten bullets that match the role's core competencies. Preserve evidence density: include 2-4 tight, specific bullets per major role. Do not collapse multiple achievements into one vague bullet."]
    },
    "roleAdjustments": {
      "experience-or-leadership-id": { "role": "optional tailored title - use a real, functional title, never a buzzword like 'Strategic Innovator'", "company": "optional tailored company" }
    },
    "hiddenSections": ["optional array of section names to hide: 'summary', 'education', 'experience', 'leadership', 'projects', 'skills', 'certifications'"]
  }
}

CRITICAL RULES - NEVER VIOLATE:
- NEVER change numbers, dates, company names, certification names, or titles.
- NEVER fabricate data. Use only facts from masterData.
- NEVER default to a product-manager framing unless the job description is explicitly for product management.
- NEVER use fluffy poster language in the header or summary.
- NEVER use pronouns or the candidate's name in the summary.
- PRESERVE EVIDENCE DENSITY. Do not collapse 2-3 concrete bullets into one vague, buzzword-heavy bullet. A weak single bullet like "developed an AI-driven platform to solve industry challenges" is worse than three specific bullets about customer interviews, feature iteration, and operations. Keep the proof.
- NEVER inflate titles with buzzwords like "Strategic Innovator," "Visionary," or "Change Agent." If you adjust a role title in roleAdjustments, use a real, functional title (e.g., "Business Development Lead," "Operations Coordinator") that describes what the person actually did.
- HONEST FRAMING beats keyword matching. Do not bend an experience into a story it is not just because the job description uses a tempting word. Use the candidate's actual evidence and let the reader draw the connection.
- STRICTLY FORBIDDEN: mentioning the target/hiring company's name anywhere in the resume, including resumeName, summary, headerTitle, educationFocus, bullets, skills, or any other field. Before returning, scan every string and remove every occurrence. If you are unsure whether a word is the company name, remove it.
- NEVER claim competency categories the candidate has no evidence for. If the job wants "contract management" and the candidate has never managed a contract, do NOT put "Contract Management" in skills, do NOT write bullets implying contract management, and do NOT frame customer discovery interviews as account management. A recruiter who knows the role will see through it immediately and it costs the candidate credibility.
- resumeName must describe the candidate's ACTUAL identity, not the target job title. If the candidate is a founder/franchisee/student leader applying to a contract management role, the resume name should reflect their real background (e.g., "Business Development & Operations"), not what the role is called ("Contract Management Specialist"). Claiming a title you haven't held reads as dishonest.

CREDIBILITY RULES FOR BULLETS:
1. Claims must show the mechanism: "reduced onboarding time from X days to Y days" > "improved onboarding."
2. Growth claims use X→Y format: "Grew membership from X to Y (+Z%)" > "Expanded membership by Z%."
3. Remove self-congratulatory filler: no "showcasing leadership" or "demonstrating strategic thinking."
4. Concrete skills > abstract skills. Avoid generic soft skills unless the job specifically names them.

SKILLS SELECTION RULES:
- Select 2-4 skill categories based on the job's requirements.
- Total 8-15 individual skills.
- Exclude generic fluff: "Communication", "Problem Solving", "Teamwork" unless the job explicitly demands them.
- For HR/ops roles: prioritize scheduling, onboarding, documentation, process coordination, Google Workspace, HR tools, calendar management, event coordination.
- For sales roles: prioritize pipeline, prospecting, CRM, relationship management, closing.
- For operations roles: prioritize process optimization, project management, documentation, cross-functional coordination.
- For product roles: prioritize customer discovery, prioritization, roadmapping, user research.
- Category examples: "Operations + Process", "People + Coordination", "Tools + Systems", "Technical + AI", "Customer + Sales".

Ensure selectedExperiences uses IDs from masterData.experiences, and selectedLeadership uses IDs from masterData.leadership.`;
}

export function buildRefinementPrompt(
  jobDescription: string,
  draftResult: any,
  personalContext: string
): string {
  return `You are a senior resume consultant reviewing a draft resume and recommendations. Use the candidate's personal context to provide MORE SPECIFIC, CONTEXT-AWARE recommendations.

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

Example of a GOOD recommendation using personal context (for an HR/ops role):
"In cover letter, lead with your operations and sales experience: Instead of framing it as pure sales achievement, reframe it as 'Hired, onboarded, and scheduled a seasonal team while running a seasonal territory — the same coordination, documentation, and systems mindset needed in an HR coordination and operations role.' This codes you as an operator, not a salesperson."

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
}
