'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type LayoutMode = 'compressed' | 'normal' | 'spacious';

export default function ResumePreviewPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('normal');

  const printTitle = generatedData?.data?.resumeName || 'Resume';

  useEffect(() => {
    const storedData = sessionStorage.getItem('generatedResume');
    console.log('Stored data:', storedData);
    if (storedData) {
      const parsed = JSON.parse(storedData);
      console.log('Parsed data:', parsed);
      setGeneratedData(parsed);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('resumeLayoutMode') as LayoutMode | null;
      if (stored === 'compressed' || stored === 'normal' || stored === 'spacious') {
        setLayoutMode(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('resumeLayoutMode', layoutMode);
    } catch {
      // ignore
    }
  }, [layoutMode]);

  useEffect(() => {
    const titleElement = document.querySelector('title');
    const originalTitle = titleElement?.textContent || '';

    const handleBeforePrint = () => {
      if (titleElement) titleElement.textContent = printTitle;
    };

    const handleAfterPrint = () => {
      if (titleElement) titleElement.textContent = originalTitle;
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      if (titleElement) titleElement.textContent = originalTitle;
    };
  }, [printTitle]);

  if (isLoading) {
    return (
      <div className="resume-viewer">
        <div className="viewer-header">
          <Link href="/" className="back-link">← Back to Dashboard</Link>
        </div>

        <div className="layout-switcher" role="group" aria-label="Layout density">
          <button
            type="button"
            className={layoutMode === 'compressed' ? 'active' : ''}
            onClick={() => setLayoutMode('compressed')}
          >
            Compressed
          </button>
          <button
            type="button"
            className={layoutMode === 'normal' ? 'active' : ''}
            onClick={() => setLayoutMode('normal')}
          >
            Normal
          </button>
          <button
            type="button"
            className={layoutMode === 'spacious' ? 'active' : ''}
            onClick={() => setLayoutMode('spacious')}
          >
            Spacious
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Loading resume preview...</h2>
        </div>
      </div>
    );
  }

  if (!generatedData) {
    return (
      <div className="resume-viewer">
        <div className="viewer-header">
          <Link href="/" className="back-link">← Back to Dashboard</Link>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>No resume data found</h2>
          <p style={{ color: 'var(--muted)', marginTop: '16px' }}>
            Try generating a new resume from the dashboard
          </p>
        </div>
      </div>
    );
  }

  const { data, masterData } = generatedData;
  
  console.log('Data structure:', {
    resumeName: data?.resumeName,
    hasExperiences: !!data?.selectedExperiences,
    hasLeadership: !!data?.selectedLeadership,
    hasMasterData: !!masterData
  });

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/save-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, masterData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save resume');
      }

      const result = await response.json();
      
      sessionStorage.removeItem('generatedResume');
      
      alert(`Resume "${data.resumeName}" saved successfully!`);
      
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Failed to save resume. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="resume-viewer">
      <div className="viewer-header">
        <Link href="/" className="back-link">← Back to Dashboard</Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="button-secondary"
            onClick={() => router.push('/')}
          >
            Cancel
          </button>
          <button 
            className="button-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Resume'}
          </button>
        </div>
      </div>

      <div className="preview-container">
        <div className="preview-sidebar">
          <h2>AI Recommendations</h2>
          
          <section className="recommendation-section">
            <h3>Resume Name</h3>
            <p className="highlight">{data.resumeName}</p>
          </section>

          <section className="recommendation-section">
            <h3>Keywords to Emphasize</h3>
            <ul className="keyword-list">
              {data.tailoringNotes.keywords.map((keyword: string, i: number) => (
                <li key={i} className="keyword-badge">{keyword}</li>
              ))}
            </ul>
          </section>

          <section className="recommendation-section">
            <h3>Your Strengths</h3>
            <ul className="recommendation-list">
              {data.tailoringNotes.strengths.map((strength: string, i: number) => (
                <li key={i}>{strength}</li>
              ))}
            </ul>
          </section>

          <section className="recommendation-section">
            <h3>Recommendations</h3>
            <ul className="recommendation-list">
              {data.tailoringNotes.recommendations.map((rec: string, i: number) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </section>

          {data.tailoringNotes.warnings.length > 0 && (
            <section className="recommendation-section warning">
              <h3>⚠️ Considerations</h3>
              <ul className="recommendation-list">
                {data.tailoringNotes.warnings.map((warning: string, i: number) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="preview-main">
          <div className="page">
            <div className="print-only-metadata" style={{ display: 'none' }} data-resume-title={printTitle}>
              {printTitle}
            </div>
            <div className="resume show" data-layout={layoutMode}>
              <header className="head">
                <div>
                  <h1>{masterData.personalInfo.name} <span className="pronouns">({masterData.personalInfo.pronouns})</span></h1>
                  <p className="subtitle">{data.customizations.educationFocus || 'Professional'}</p>
                </div>
                <div className="contact">
                  <p><b>{masterData.personalInfo.location}</b> • {masterData.personalInfo.email}</p>
                  <p>{masterData.personalInfo.phone} • {masterData.personalInfo.linkedin}</p>
                </div>
              </header>

              <div className="grid">
                <main className="main">
                  {masterData.personalInfo?.summary && (
                    <section>
                      <h2>Summary</h2>
                      <p>{masterData.personalInfo.summary}</p>
                    </section>
                  )}

                  <section>
                    <h2>Education</h2>
                    <p>
                      <b>{masterData.education.degree}</b> • {masterData.education.institution}{' '}
                      <span className="small">({masterData.education.dates})</span>
                    </p>
                    {data.customizations.educationFocus && (
                      <p><b>Focus:</b> {data.customizations.educationFocus}</p>
                    )}
                  </section>

                  <section>
                    <h2>Experience</h2>
                    {data.selectedExperiences?.map((expId: string) => {
                      const experience = masterData.experiences.find((e: any) => e.id === expId);
                      if (!experience) return null;

                      const customBullets = data.customizations.bulletPointAdjustments?.[expId];
                      const bullets = customBullets || experience.bullets;

                      return (
                        <div key={expId} className="role avoid-break">
                          <div className="role-head">
                            <div>
                              <b>{experience.role}</b> • {experience.company}
                            </div>
                            <div className="small">{experience.dates}</div>
                          </div>
                          <ul>
                            {bullets.map((bullet: string, i: number) => (
                              <li key={i}>{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </section>

                  {data.selectedLeadership && data.selectedLeadership.length > 0 && (
                    <section>
                      <h2>Leadership</h2>
                      {data.selectedLeadership.map((leadId: string) => {
                        const leadership = masterData.leadership.find((l: any) => l.id === leadId);
                        if (!leadership) return null;

                        const customBullets = data.customizations.bulletPointAdjustments?.[leadId];
                        const bullets = customBullets || leadership.bullets;

                        return (
                          <div key={leadId} className="role avoid-break">
                            <div className="role-head">
                              <div>
                                <b>{leadership.role}</b> • {leadership.company}
                              </div>
                              <div className="small">{leadership.dates}</div>
                            </div>
                            <ul>
                              {bullets.map((bullet: string, i: number) => (
                                <li key={i}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </section>
                  )}

                  {data.selectedProjects && data.selectedProjects.length > 0 && (
                    <section>
                      <h2>Projects</h2>
                      {data.selectedProjects.map((projId: string) => {
                        const project = masterData.projects.find((p: any) => p.id === projId);
                        if (!project) return null;

                        return (
                          <div key={projId} className="avoid-break">
                            <p><b>{project.title}</b></p>
                            <ul>
                              {project.bullets.map((bullet: string, i: number) => (
                                <li key={i}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </section>
                  )}
                </main>

                <aside className="side">
                  {data.selectedSkills && data.selectedSkills.length > 0 && (() => {
                    // Backward compatibility: convert old flat array to categorized format
                    const normalizedSkills = typeof data.selectedSkills[0] === 'string' 
                      ? [{ category: 'Skills', items: data.selectedSkills }]
                      : data.selectedSkills;
                    
                    return (
                      <section>
                        <h2>Skills</h2>
                        {normalizedSkills.map((skillCat: any, i: number) => (
                          <div key={i} style={{ marginBottom: '12px' }}>
                            <p style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>{skillCat.category}</p>
                            <p className="small" style={{ margin: 0 }}>{skillCat.items.join(', ')}</p>
                          </div>
                        ))}
                      </section>
                    );
                  })()}

                  {masterData.certifications && masterData.certifications.length > 0 && (
                    <section>
                      <h2>Certifications</h2>
                      {masterData.certifications.map((cert: any, i: number) => (
                        <div key={i}>
                          <p><b>{cert.name}</b></p>
                          {cert.details && <p className="small">{cert.details}</p>}
                        </div>
                      ))}
                    </section>
                  )}
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .layout-switcher {
          position: fixed;
          top: 92px;
          right: 24px;
          z-index: 50;
          display: flex;
          gap: 8px;
          padding: 8px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--card) 80%, black 20%);
          border: 1px solid var(--line);
          backdrop-filter: blur(6px);
        }

        .layout-switcher button {
          padding: 8px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 650;
        }

        .layout-switcher button.active {
          background: color-mix(in srgb, var(--accent) 18%, #171b24);
          border-color: color-mix(in srgb, var(--accent) 55%, var(--line));
        }

        @media print {
          .layout-switcher {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
