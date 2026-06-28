import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser, ensureUserExists } from '@/lib/auth-helpers';
import { hasCredits, deductCredits, getCredits, CREDIT_COSTS } from '@/lib/credits';
import { createClient } from '@/lib/supabase/server';
import { decryptData, encryptData, getEncryptionKey } from '@/lib/encryption';
import { extractCompanyName, sanitizeCompanyName } from '@/lib/resume-sanitization';
import { buildGenerateResumePrompt, buildRefinementPrompt } from '@/lib/prompts/generate-resume-prompt';

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

    // Ensure user row exists with correct defaults (3 credits, admin flag)
    await ensureUserExists(user.id, user.email || '');

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
    const personalContext = [
      masterData.personalContext,
      masterData.websiteContext ? `PORTFOLIO/WEBSITE CONTEXT:\n${masterData.websiteContext}` : '',
    ].filter(Boolean).join('\n\n');

    const prompt = buildGenerateResumePrompt(jobDescription, masterData, userPrefs, personalContext);

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
    
    const hasContext = personalContext && personalContext.trim();
    if (hasContext) {
      const refinementPrompt = buildRefinementPrompt(jobDescription, draftResult, personalContext);

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

    // Extract and remove any target company name from the generated resume
    const companyName = extractCompanyName(jobDescription);
    finalResult = sanitizeCompanyName(finalResult, companyName);

    // Save generated resume to encrypted database
    const encryptedData = encryptData(finalResult, encryptionKey);
    
    // Use the role-focused resumeName generated by the AI (sanitized above)
    const resumeName = (finalResult as any).resumeName || 'Generated Resume';
    
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
      creditsRemaining: await getCredits(user.id),
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
