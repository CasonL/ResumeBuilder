'use client';

import { use, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { estimateResumeHeight } from '@/lib/measureResumeLayout';
import Link from 'next/link';
import { mergeCustomizationsIntoMaster } from '@/lib/resume-editor-helpers';

const ResumeInnovates = dynamic(() => import('@/components/resumes/ResumeInnovates'), { ssr: false });
const ResumeTD = dynamic(() => import('@/components/resumes/ResumeTD'), { ssr: false });
const ResumeGenerated = dynamic(() => import('@/components/resumes/ResumeGenerated'), { ssr: false });
const ResumeEditor = dynamic(() => import('@/components/resumes/ResumeEditor'), { ssr: false });
const ResumeChat = dynamic(() => import('@/components/resumes/ResumeChat'), { ssr: false });

type LayoutMode = 'compressed' | 'normal' | 'spacious';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ResumePage({ params }: PageProps) {
  const { id } = use(params);
  const [generatedResumeData, setGeneratedResumeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [editedMasterData, setEditedMasterData] = useState<any>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('normal');
  const [isRefining, setIsRefining] = useState(false);
  const [refinementStatus, setRefinementStatus] = useState('');
  const [showFitPrompt, setShowFitPrompt] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const fitPromptDismissedAtRef = useRef<number>(0); // height when user last dismissed
  const resumeContainerRef = useRef<HTMLDivElement>(null);

  const getPrintTitle = () => {
    if (generatedResumeData?.data?.resumeName) return generatedResumeData.data.resumeName;
    if (id === 'innovates') return 'Alberta Innovates Resume';
    if (id === 'td-bank') return 'TD Bank Resume';
    return 'Resume';
  };

  useEffect(() => {
    console.log('Resume page loaded with ID:', id);
    
    const loadGeneratedResume = async () => {
      if (id !== 'innovates' && id !== 'td-bank') {
        console.log('Loading generated resume:', id);
        try {
          const response = await fetch(`/api/resumes/${id}`);
          console.log('Response status:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('Loaded generated resume data:', data);
            setGeneratedResumeData(data);
          }
        } catch (error) {
          console.error('Error loading generated resume:', error);
        }
      } else {
        console.log('Showing static resume:', id);
      }
      setIsLoading(false);
    };
    loadGeneratedResume();
  }, [id]);

  useEffect(() => {
    const titleElement = document.querySelector('title');
    const originalTitle = titleElement?.textContent || '';
    const printTitle = getPrintTitle();

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
  }, [generatedResumeData, id]);

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

  if (isLoading) {
    return (
      <div className="resume-viewer">
        <header className="viewer-header">
          <Link href="/" className="back-link">← Back to Dashboard</Link>
        </header>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!editedData || !generatedResumeData) return;
    
    try {
      // Save the resume data
      const resumeResponse = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: editedData })
      });
      
      if (!resumeResponse.ok) {
        throw new Error('Failed to save resume');
      }

      // If master profile was edited, sync it back
      if (editedMasterData) {
        const profileResponse = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedMasterData)
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to save master profile');
        }
      }
      
      setGeneratedResumeData({
        ...generatedResumeData,
        data: editedData,
        masterData: editedMasterData || generatedResumeData.masterData
      });
      setIsEditing(false);
      setEditedMasterData(null);
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const applyFitChanges = (data: any, masterData: any, changes: any[]): any => {
    const bulletAdj = { ...(data.customizations?.bulletPointAdjustments || {}) };
    const hidden = [...(data.customizations?.hiddenSections || [])];
    let selectedExp = [...(data.selectedExperiences || [])];
    let selectedLead = [...(data.selectedLeadership || [])];
    const allItems = [...(masterData?.experiences || []), ...(masterData?.leadership || [])];

    for (const change of changes) {
      if (change.type === 'remove_bullet') {
        const { roleId, bulletIndex } = change;
        const item = allItems.find((x: any) => x.id === roleId);
        const bullets: string[] = bulletAdj[roleId] || item?.bullets || [];
        bulletAdj[roleId] = bullets.filter((_: string, i: number) => i !== bulletIndex);
      } else if (change.type === 'rewrite_bullet') {
        const { roleId, bulletIndex, newText } = change;
        const item = allItems.find((x: any) => x.id === roleId);
        const bullets: string[] = bulletAdj[roleId] || item?.bullets || [];
        bulletAdj[roleId] = bullets.map((b: string, i: number) => i === bulletIndex ? newText : b);
      } else if (change.type === 'hide_section') {
        if (!hidden.includes(change.section)) hidden.push(change.section);
      } else if (change.type === 'remove_experience') {
        selectedExp = selectedExp.filter((id: string) => id !== change.roleId);
        selectedLead = selectedLead.filter((id: string) => id !== change.roleId);
      }
    }
    return {
      ...data,
      selectedExperiences: selectedExp,
      selectedLeadership: selectedLead,
      customizations: { ...data.customizations, bulletPointAdjustments: bulletAdj, hiddenSections: hidden },
    };
  };

  const buildSections = (data: any, masterData: any) => {
    const hidden: string[] = data.customizations?.hiddenSections || [];
    return {
      certifications: { visible: !hidden.includes('certifications') && !!(masterData?.certifications?.length), count: masterData?.certifications?.length || 0 },
      skills:         { visible: !hidden.includes('skills')         && !!(data.selectedSkills?.length),          categories: (data.selectedSkills || []).length },
      projects:       { visible: !hidden.includes('projects')       && !!(data.selectedProjects?.length),        count: (data.selectedProjects || []).length },
    };
  };

  const handleFitToPage = async (targetLength: '1-page' | '2-page' = '1-page') => {
    const el = resumeContainerRef.current?.querySelector('.resume') as HTMLElement | null;
    if (!el || isRefining || !generatedResumeData) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const { measureResumeLayout } = await import('@/lib/measureResumeLayout');
      setIsRefining(true);
      setRefinementStatus('measuring layout…');
      const rData = generatedResumeData.data;
      const mData = generatedResumeData.masterData;
      const layoutReport = await measureResumeLayout(el, rData, mData);
      if (layoutReport.overflowPx <= 0) {
        setRefinementStatus('already fits ✔');
        await new Promise((r) => setTimeout(r, 1500));
        return;
      }
      setRefinementStatus(`${layoutReport.overflowPx}px over — asking AI…`);
      const res = await fetch('/api/refine-resume-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          layoutReport,
          targetLength,
          jobDescription: generatedResumeData.jobDescription,
          strongestThread: rData.fitAssessment?.strongestThread,
          sections: buildSections(rData, mData),
        }),
      });
      const result = await res.json();
      if (result.changes?.length) {
        // Apply changes one-by-one, stopping if any would drop below minHeightPx
        const { estimateResumeHeight } = await import('@/lib/measureResumeLayout');
        let current = rData;
        let applied = 0;
        for (const change of result.changes) {
          const candidate = applyFitChanges(current, mData, [change]);
          if (estimateResumeHeight(candidate, mData) >= layoutReport.minHeightPx) {
            current = candidate;
            applied++;
          }
        }
        setRefinementStatus(`Pass 1: applying ${applied} cut(s)…`);
        const updated = current;
        setGeneratedResumeData((prev: any) => ({ ...prev, data: updated }));

        // Pass 2 — re-measure in memory (pure calc, no DOM needed)
        const { measureResumeLayout: measure2 } = await import('@/lib/measureResumeLayout');
        const report2 = await measure2(el, updated, mData);
        if (report2.overflowPx > 0) {
          setRefinementStatus(`Pass 2: ${report2.overflowPx}px over — asking AI…`);
          const res2 = await fetch('/api/refine-resume-vision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              layoutReport: report2,
              targetLength,
              jobDescription: generatedResumeData.jobDescription,
              strongestThread: updated.fitAssessment?.strongestThread,
              sections: buildSections(updated, mData),
            }),
          });
          const result2 = await res2.json();
          if (result2.changes?.length) {
            let current2 = updated;
            let applied2 = 0;
            for (const change of result2.changes) {
              const candidate2 = applyFitChanges(current2, mData, [change]);
              if (estimateResumeHeight(candidate2, mData) >= report2.minHeightPx) {
                current2 = candidate2;
                applied2++;
              }
            }
            setRefinementStatus(`Pass 2: applying ${applied2} cut(s)…`);
            setGeneratedResumeData((prev: any) => ({ ...prev, data: current2 }));
          }
        }
      } else {
        setRefinementStatus('already fits ✔');
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setRefinementStatus('timed out — try again');
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        console.error('Fit to page failed:', e);
      }
    } finally {
      clearTimeout(timeout);
      setIsRefining(false);
      setRefinementStatus('');
    }
  };

  const handleApplyChanges = (modifiedData: any, modifiedMasterData?: any) => {
    const baseData = modifiedData || generatedResumeData?.data;
    const baseMaster = modifiedMasterData || generatedResumeData?.masterData;
    const mergedMaster = mergeCustomizationsIntoMaster(baseData, baseMaster);
    const cleanedData = {
      ...baseData,
      customizations: {
        ...baseData.customizations,
        bulletPointAdjustments: {},
        roleAdjustments: {}
      }
    };
    setEditedData(cleanedData);
    setEditedMasterData(mergedMaster);
    setIsEditing(true);
    // Only prompt if resume is taller than when user last dismissed the prompt
    const currentH = estimateResumeHeight(baseData, baseMaster);
    if (currentH > fitPromptDismissedAtRef.current) setShowFitPrompt(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const doPrint = () => {
    const titleElement = document.querySelector('title');
    const originalTitle = titleElement?.textContent || '';
    if (titleElement) titleElement.textContent = getPrintTitle();
    setTimeout(() => {
      window.print();
      setTimeout(() => { if (titleElement) titleElement.textContent = originalTitle; }, 100);
    }, 50);
  };

  const handlePrint = () => setShowPrintDialog(true);

  return (
    <div className="resume-viewer" data-editing={isEditing}>
      <header className="viewer-header">
        <Link href="/" className="back-link">
          ← Back to Dashboard
        </Link>
        <div className="viewer-actions">
          {generatedResumeData && (
            <>
              {!isEditing ? (
                <>
                  <button
                    className="edit-btn"
                    onClick={() => handleFitToPage('1-page')}
                    disabled={isRefining}
                    title="Use AI vision to trim content to 1 page"
                    style={{ background: 'rgba(37,99,235,0.15)', borderColor: 'rgba(37,99,235,0.4)', color: '#93c5fd' }}
                  >
                    📐 Fit to 1 Page
                  </button>
                  <button className="edit-btn" onClick={() => {
                    setIsEditing(true);
                    const mergedMaster = mergeCustomizationsIntoMaster(generatedResumeData.data, generatedResumeData.masterData);
                    const cleanedData = {
                      ...generatedResumeData.data,
                      customizations: {
                        ...generatedResumeData.data.customizations,
                        bulletPointAdjustments: {},
                        roleAdjustments: {}
                      }
                    };
                    setEditedData(cleanedData);
                    setEditedMasterData(mergedMaster);
                  }}>
                    ✏️ Edit Resume
                  </button>
                  <button className="print-btn" onClick={handlePrint}>
                    🖨️ Print Resume
                  </button>
                </>
              ) : (
                <>
                  <button className="save-btn" onClick={handleSave}>
                    💾 Save Changes
                  </button>
                  <button className="undo-btn" onClick={() => {
                    const mergedMaster = mergeCustomizationsIntoMaster(generatedResumeData.data, generatedResumeData.masterData);
                    const cleanedData = {
                      ...generatedResumeData.data,
                      customizations: {
                        ...generatedResumeData.data.customizations,
                        bulletPointAdjustments: {},
                        roleAdjustments: {}
                      }
                    };
                    setEditedData(cleanedData);
                    setEditedMasterData(mergedMaster);
                  }}>
                    ↩️ Undo All
                  </button>
                  <button className="cancel-btn" onClick={() => {
                    setIsEditing(false);
                    setEditedData(null);
                    setEditedMasterData(null);
                  }}>
                    Cancel
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </header>

      {/* Post-chat fit prompt banner */}
      {showFitPrompt && !isRefining && (
        <div style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.35)', borderRadius: 8, margin: '10px 16px 0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ color: '#93c5fd', fontSize: 14, flex: 1 }}>✨ Resume updated! Want to trim weak bullets and fit it to <strong>1 page</strong>?</span>
          <button
            onClick={() => { setShowFitPrompt(false); handleFitToPage('1-page'); }}
            style={{ background: 'rgba(37,99,235,0.25)', border: '1px solid rgba(37,99,235,0.5)', color: '#93c5fd', borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Fit to 1 Page
          </button>
          <button
            onClick={() => {
              const h = estimateResumeHeight(
                generatedResumeData?.data || editedData,
                generatedResumeData?.masterData || editedMasterData
              );
              fitPromptDismissedAtRef.current = h;
              setShowFitPrompt(false);
            }}
            style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13, padding: '5px 8px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Print confirmation dialog */}
      {showPrintDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e222d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '28px 32px', maxWidth: 420, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🖨️</div>
            <h3 style={{ color: '#f1f5f9', margin: '0 0 8px', fontSize: 18 }}>Before you print…</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
              Would you like to automatically trim weaker bullets to fit this resume on <strong style={{ color: '#93c5fd' }}>1 page</strong> before printing?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setShowPrintDialog(false); handleFitToPage('1-page').then(() => doPrint()); }}
                style={{ background: 'rgba(37,99,235,0.25)', border: '1px solid rgba(37,99,235,0.5)', color: '#93c5fd', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                ✂️ Trim & Print
              </button>
              <button
                onClick={() => { setShowPrintDialog(false); doPrint(); }}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}
              >
                Print as-is
              </button>
              <button
                onClick={() => setShowPrintDialog(false)}
                style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13, width: '100%', marginTop: 4 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

      <div className={`resume-layout ${isEditing ? 'editing' : ''}`}>
        {isRefining && (
          <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(15,15,25,0.92)', backdropFilter: 'blur(6px)', color: '#93c5fd', fontSize: '13px', fontWeight: 600, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(147,197,253,0.2)' }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #93c5fd', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ✦ Fitting to page: {refinementStatus}
          </div>
        )}
        <div className="page">
          <div className="resume-mode-wrap" data-layout={layoutMode} ref={resumeContainerRef}>
            <div className="print-only-metadata" style={{ display: 'none' }} data-resume-title={getPrintTitle()}>
              {getPrintTitle()}
            </div>
            {id === 'innovates' && <ResumeInnovates isActive={true} />}
            {id === 'td-bank' && <ResumeTD isActive={true} />}
            {generatedResumeData && (
              <ResumeGenerated
                isActive={true}
                data={isEditing ? editedData : generatedResumeData.data}
                masterData={isEditing ? editedMasterData : generatedResumeData.masterData}
                isEditing={false}
                onUpdate={undefined}
              />
            )}
          </div>
        </div>
        {isEditing && editedData && editedMasterData && (
          <ResumeEditor
            data={editedData}
            masterData={editedMasterData}
            onChange={(newData, newMasterData) => {
              setEditedData(newData);
              setEditedMasterData(newMasterData);
            }}
          />
        )}
      </div>

      {generatedResumeData && id !== 'innovates' && id !== 'td-bank' && (
        <ResumeChat
          resumeId={id}
          onApplyChanges={handleApplyChanges}
          estimatedHeightPx={estimateResumeHeight(
            generatedResumeData.data,
            generatedResumeData.masterData
          )}
          targetLength={generatedResumeData.preferences?.targetLength}
        />
      )}

      <style jsx>{`
        .resume-viewer {
          max-width: none;
          width: 100%;
          padding: 24px;
        }

        .resume-layout {
          max-width: 100%;
          margin: 0 auto;
          padding: 24px;
          display: flex;
          justify-content: center;
        }

        .resume-layout .page {
          width: 8.5in;
          min-width: 8.5in;
          max-width: 8.5in;
        }

        .layout-switcher {
          position: fixed;
          top: 92px;
          right: 24px;
          z-index: 50;
          display: flex;
          gap: 8px;
          padding: 8px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--card) 85%, var(--bg) 15%);
          border: 1px solid var(--line);
          backdrop-filter: blur(6px);
        }

        .resume-viewer[data-editing="true"] .layout-switcher {
          display: none;
        }

        .layout-switcher button {
          padding: 8px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 650;
        }

        .layout-switcher button.active {
          background: color-mix(in srgb, var(--accent) 18%, var(--card2));
          border-color: color-mix(in srgb, var(--accent) 55%, var(--line));
        }

        .resume-layout.editing {
          display: flex;
          justify-content: flex-start;
          align-items: flex-start;
          gap: 24px;
          padding: 24px 24px 24px 24px;
        }

        .resume-layout.editing .page {
          flex: 0 0 auto;
          width: 8.5in;
          min-width: 8.5in;
          max-width: 8.5in;
        }

        .viewer-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .edit-btn, .save-btn, .cancel-btn, .undo-btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: var(--card);
          color: var(--text);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .edit-btn:hover, .save-btn:hover {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .undo-btn:hover {
          background: #c49a45;
          border-color: #c49a45;
          color: white;
        }

        .cancel-btn:hover {
          background: #a8645b;
          border-color: #a8645b;
          color: white;
        }

        @media print {
          .resume-viewer {
            padding: 0 !important;
            margin: 0 !important;
          }

          .resume-layout,
          .resume-layout.editing {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .resume-layout .page,
          .resume-layout.editing .page {
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }
          
          .viewer-header {
            display: none !important;
          }

          .layout-switcher {
            display: none !important;
          }

          :global(.resume-chat-button),
          :global(.resume-chat-panel) {
            display: none !important;
          }

          :global(.section-visibility-panel) {
            display: none !important;
          }

          :global(.resume-editor) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
