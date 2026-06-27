'use client';

import { useState, useMemo } from 'react';

interface GenerateResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (jobDescription: string, preferences: ResumePreferences) => void;
  masterData?: any;
}

interface ResumePreferences {
  targetLength: '1-page' | '2-page';
  layoutStyle: 'balanced-columns' | 'content-heavy' | 'sidebar-focus';
  prioritySections: string[];
  tone: 'professional' | 'creative' | 'technical';
  includeAchievements: boolean;
}

interface JobRecommendations {
  targetLength: '1-page' | '2-page';
  layoutStyle: 'balanced-columns' | 'content-heavy' | 'sidebar-focus';
  tone: 'professional' | 'creative' | 'technical';
  prioritySections: string[];
  reasoning: {
    length: string;
    layout: string;
    tone: string;
    sections: string;
  };
}

export default function GenerateResumeModal({ isOpen, onClose, onGenerate, masterData }: GenerateResumeModalProps) {
  const [step, setStep] = useState(1);
  const [jobDescription, setJobDescription] = useState('');
  const [preferences, setPreferences] = useState<ResumePreferences>({
    targetLength: '1-page',
    layoutStyle: 'balanced-columns',
    prioritySections: [],
    tone: 'professional',
    includeAchievements: true,
  });
  const [recommendations, setRecommendations] = useState<JobRecommendations | null>(null);
  const [fitAssessment, setFitAssessment] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentWarning, setContentWarning] = useState<string | null>(null);

  // Validate profile data for minimum requirements
  const profileValidation = useMemo(() => {
    console.log('Validating profile data:', masterData);
    
    if (!masterData) {
      console.log('No masterData - validation failed');
      return {
        isValid: false,
        message: 'Please add your profile information first'
      };
    }

    const experiences = masterData.experiences || [];
    const leadership = masterData.leadership || [];
    const totalExperiences = experiences.length + leadership.length;
    const hasSummary = masterData.personalInfo?.summary?.trim();

    console.log('Validation check:', {
      experiencesCount: experiences.length,
      leadershipCount: leadership.length,
      totalExperiences,
      hasSummary: !!hasSummary
    });

    if (totalExperiences < 2) {
      console.log('Not enough experiences - validation failed');
      return {
        isValid: false,
        message: 'Add at least 2 experiences to generate a resume'
      };
    }

    if (!hasSummary) {
      console.log('No summary - validation failed');
      return {
        isValid: false,
        message: 'Add a professional summary to your profile'
      };
    }

    console.log('Validation passed!');
    return { isValid: true, message: '' };
  }, [masterData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent form submission on steps 1-2
    if (step < 3) {
      return;
    }
  };

  const handleGenerate = async () => {
    if (!jobDescription.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      await onGenerate(jobDescription, preferences);
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeJobDescription = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, masterData }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
        if (data.fitAssessment) setFitAssessment(data.fitAssessment);
        
        setPreferences({
          targetLength: data.recommendations.targetLength,
          layoutStyle: data.recommendations.layoutStyle,
          prioritySections: data.recommendations.prioritySections,
          tone: data.recommendations.tone,
          includeAchievements: true,
        });
      }
    } catch (error) {
      console.error('Failed to analyze job description:', error);
    } finally {
      setIsAnalyzing(false);
      setStep(2);
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      await analyzeJobDescription();
    } else {
      setStep(step + 1);
    }
  };

  const handleClose = () => {
    if (!isGenerating && !isAnalyzing) {
      setStep(1);
      setJobDescription('');
      setRecommendations(null);
      setFitAssessment(null);
      setPreferences({
        targetLength: '1-page',
        layoutStyle: 'balanced-columns',
        prioritySections: [],
        tone: 'professional',
        includeAchievements: true,
      });
      onClose();
    }
  };

  const togglePrioritySection = (section: string) => {
    setPreferences(prev => ({
      ...prev,
      prioritySections: prev.prioritySections.includes(section)
        ? prev.prioritySections.filter(s => s !== section)
        : [...prev.prioritySections, section]
    }));
  };

  const checkContentSufficiency = (targetLength: '1-page' | '2-page') => {
    if (!masterData || targetLength === '1-page') {
      setContentWarning(null);
      return;
    }

    const experienceCount = masterData.experiences?.length || 0;
    const leadershipCount = masterData.leadership?.length || 0;
    const projectCount = masterData.projects?.length || 0;

    // For 2-page resume, we need:
    // - 5-6 experiences (each with 3-4 bullets)
    // - 3-4 leadership roles
    // - 2-3 projects
    const hasEnoughExperiences = experienceCount >= 5;
    const hasEnoughLeadership = leadershipCount >= 3;
    const hasEnoughProjects = projectCount >= 2;

    if (!hasEnoughExperiences || !hasEnoughLeadership || !hasEnoughProjects) {
      const missing = [];
      if (!hasEnoughExperiences) missing.push(`${experienceCount}/5+ experiences`);
      if (!hasEnoughLeadership) missing.push(`${leadershipCount}/3+ leadership roles`);
      if (!hasEnoughProjects) missing.push(`${projectCount}/2+ projects`);
      
      setContentWarning(
        `⚠️ You may not have enough content for a 2-page resume. Current: ${missing.join(', ')}. The generated resume might be shorter than 2 pages.`
      );
    } else {
      setContentWarning(null);
    }
  };

  const handleTargetLengthChange = (targetLength: '1-page' | '2-page') => {
    setPreferences({ ...preferences, targetLength });
    checkContentSufficiency(targetLength);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Generate New Resume {step > 1 && `(Step ${step} of 3)`}</h2>
          <button 
            className="modal-close" 
            onClick={handleClose}
            disabled={isGenerating}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="form-group">
              <label htmlFor="job-description">
                What role are you applying for?
              </label>
              <textarea
                id="job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description or describe the role and company"
                rows={8}
                disabled={isGenerating}
                autoFocus
              />
              <span className="form-hint">
                Include key requirements, desired skills, and company info for best results
              </span>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {fitAssessment && (() => {
                const score = Number(fitAssessment.score);
                const color = score >= 7 ? '#86efac' : score >= 5 ? '#fde68a' : '#fca5a5';
                const label = score >= 7 ? 'Strong Fit' : score >= 5 ? 'Transferable' : 'Long Shot';
                return (
                  <div style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: score >= 7 ? 'rgba(134,239,172,0.07)' : score >= 5 ? 'rgba(253,230,138,0.07)' : 'rgba(252,165,165,0.07)',
                    border: `1px solid ${color}33`,
                    borderLeft: `3px solid ${color}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 700, color }}>{score}/10</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                    </div>
                    <p style={{ fontSize: '13px', margin: '0 0 8px', lineHeight: 1.5, color: 'var(--muted)' }}>{fitAssessment.honestTake}</p>
                    <p style={{ fontSize: '12px', margin: '0 0 3px', color: '#86efac' }}><strong>Strongest thread:</strong> {fitAssessment.strongestThread}</p>
                    <p style={{ fontSize: '12px', margin: 0, color: '#fca5a5' }}><strong>Biggest gap:</strong> {fitAssessment.biggestGap}</p>
                  </div>
                );
              })()}
              <div className="form-group">
                <label>How long should your resume be?</label>
                {recommendations && (
                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
                    💡 {recommendations.reasoning.length}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => handleTargetLengthChange('1-page')}
                    className={preferences.targetLength === '1-page' ? 'button-primary' : 'button-secondary'}
                    style={{ 
                      flex: 1,
                      borderColor: recommendations?.targetLength === '1-page' ? '#7c8c62' : undefined
                    }}
                  >
                    {recommendations?.targetLength === '1-page' && (
                      <span style={{ fontSize: '11px', color: '#7c8c62', display: 'block' }}>✓</span>
                    )}
                    1 Page
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTargetLengthChange('2-page')}
                    className={preferences.targetLength === '2-page' ? 'button-primary' : 'button-secondary'}
                    style={{ 
                      flex: 1,
                      borderColor: recommendations?.targetLength === '2-page' ? '#7c8c62' : undefined
                    }}
                  >
                    {recommendations?.targetLength === '2-page' && (
                      <span style={{ fontSize: '11px', color: '#7c8c62', display: 'block' }}>✓</span>
                    )}
                    2 Pages
                  </button>
                </div>
                {contentWarning && (
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#c49a45', 
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: 'rgba(196, 154, 69, 0.1)',
                    borderRadius: '4px',
                    border: '1px solid rgba(196, 154, 69, 0.3)'
                  }}>
                    {contentWarning}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>What layout style do you prefer?</label>
                {recommendations && (
                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
                    💡 {recommendations.reasoning.layout}
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, layoutStyle: 'balanced-columns' })}
                    className={preferences.layoutStyle === 'balanced-columns' ? 'button-primary' : 'button-secondary'}
                    style={{ 
                      borderColor: recommendations?.layoutStyle === 'balanced-columns' ? '#7c8c62' : undefined,
                      position: 'relative'
                    }}
                  >
                    {recommendations?.layoutStyle === 'balanced-columns' && (
                      <span style={{ fontSize: '11px', color: '#7c8c62', marginRight: '8px' }}>✓</span>
                    )}
                    Balanced 2-Column (main content + sidebar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, layoutStyle: 'content-heavy' })}
                    className={preferences.layoutStyle === 'content-heavy' ? 'button-primary' : 'button-secondary'}
                    style={{ 
                      borderColor: recommendations?.layoutStyle === 'content-heavy' ? '#7c8c62' : undefined
                    }}
                  >
                    {recommendations?.layoutStyle === 'content-heavy' && (
                      <span style={{ fontSize: '11px', color: '#7c8c62', marginRight: '8px' }}>✓</span>
                    )}
                    Content-Heavy (minimize sidebar)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, layoutStyle: 'sidebar-focus' })}
                    className={preferences.layoutStyle === 'sidebar-focus' ? 'button-primary' : 'button-secondary'}
                    style={{ 
                      borderColor: recommendations?.layoutStyle === 'sidebar-focus' ? '#7c8c62' : undefined
                    }}
                  >
                    {recommendations?.layoutStyle === 'sidebar-focus' && (
                      <span style={{ fontSize: '11px', color: '#7c8c62', marginRight: '8px' }}>✓</span>
                    )}
                    Sidebar-Focus (skills & certs prominent)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Resume tone & style?</label>
                {recommendations && (
                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
                    💡 {recommendations.reasoning.tone}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, tone: 'professional' })}
                    className={preferences.tone === 'professional' ? 'button-primary' : 'button-secondary'}
                    style={{ 
                      flex: 1,
                      borderColor: recommendations?.tone === 'professional' ? '#7c8c62' : undefined
                    }}
                  >
                    {recommendations?.tone === 'professional' && (
                      <span style={{ fontSize: '11px', color: '#7c8c62', display: 'block' }}>✓</span>
                    )}
                    Professional
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, tone: 'creative' })}
                    className={preferences.tone === 'creative' ? 'button-primary' : 'button-secondary'}
                    style={{ 
                      flex: 1,
                      borderColor: recommendations?.tone === 'creative' ? '#7c8c62' : undefined
                    }}
                  >
                    {recommendations?.tone === 'creative' && (
                      <span style={{ fontSize: '11px', color: '#7c8c62', display: 'block' }}>✓</span>
                    )}
                    Creative
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, tone: 'technical' })}
                    className={preferences.tone === 'technical' ? 'button-primary' : 'button-secondary'}
                    style={{ 
                      flex: 1,
                      borderColor: recommendations?.tone === 'technical' ? '#7c8c62' : undefined
                    }}
                  >
                    {recommendations?.tone === 'technical' && (
                      <span style={{ fontSize: '11px', color: '#7c8c62', display: 'block' }}>✓</span>
                    )}
                    Technical
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label>Which sections should get priority? (Select all that apply)</label>
                {recommendations && (
                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
                    💡 {recommendations.reasoning.sections}
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {['Work Experience', 'Leadership', 'Projects', 'Technical Skills', 'Certifications'].map(section => {
                    const isRecommended = recommendations?.prioritySections.includes(section);
                    const isSelected = preferences.prioritySections.includes(section);
                    
                    return (
                      <button
                        key={section}
                        type="button"
                        onClick={() => togglePrioritySection(section)}
                        className={isSelected ? 'button-primary' : 'button-secondary'}
                        style={{
                          borderColor: isRecommended ? '#7c8c62' : undefined,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>
                          {isSelected ? '✓ ' : ''}{section}
                        </span>
                        {isRecommended && (
                          <span style={{ fontSize: '11px', color: '#7c8c62' }}>Recommended</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <span className="form-hint" style={{ marginTop: '8px' }}>
                  Priority sections will be featured more prominently
                </span>
              </div>

              <div className="form-group">
                <label 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={(e) => e.preventDefault()}
                >
                  <input
                    type="checkbox"
                    checked={preferences.includeAchievements}
                    onChange={(e) => {
                      e.stopPropagation();
                      setPreferences({ ...preferences, includeAchievements: e.target.checked });
                    }}
                  />
                  Include achievements & awards section
                </label>
              </div>
            </div>
          )}

          <div className="modal-actions">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={isGenerating || isAnalyzing}
                className="button-secondary"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              disabled={isGenerating || isAnalyzing}
              className="button-secondary"
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={(step === 1 && !jobDescription.trim()) || isAnalyzing}
                className="button-primary"
              >
                {isAnalyzing ? 'Analyzing...' : 'Next'}
              </button>
            ) : (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!jobDescription.trim() || isGenerating || !profileValidation.isValid}
                  className="button-primary"
                  style={{
                    opacity: !profileValidation.isValid ? 0.5 : 1,
                    cursor: !profileValidation.isValid ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {!profileValidation.isValid && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  )}
                  {isGenerating ? 'Generating & Refining...' : 'Generate Resume'}
                </button>
                {!profileValidation.isValid && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: '8px',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.9)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      zIndex: 1000
                    }}
                  >
                    {profileValidation.message}
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid rgba(0, 0, 0, 0.9)'
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
