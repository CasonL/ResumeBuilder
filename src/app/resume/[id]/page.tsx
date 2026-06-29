'use client';

import { use, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
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
  const refinedRef = useRef(false);
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

  useEffect(() => {
    if (!generatedResumeData || refinedRef.current) return;
    const targetLength = generatedResumeData.preferences?.targetLength as '1-page' | '2-page' | undefined;
    if (!targetLength || id === 'innovates' || id === 'td-bank') return;
    refinedRef.current = true;

    const runRefinement = async (pass: number) => {
      const el = resumeContainerRef.current?.querySelector('.resume') as HTMLElement | null;
      if (!el) return;
      try {
        const { captureResumeWithBoundary } = await import('@/lib/captureResumeImage');
        setIsRefining(true);
        setRefinementStatus(`Pass ${pass}: scanning page fit…`);
        const targetPages = targetLength === '1-page' ? 1 : 2;
        const screenshot = await captureResumeWithBoundary(el, targetPages);
        setRefinementStatus(`Pass ${pass}: asking AI to review…`);
        const res = await fetch('/api/refine-resume-vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenshot,
            resumeData: generatedResumeData.data,
            masterData: generatedResumeData.masterData,
            targetLength,
            jobDescription: generatedResumeData.jobDescription,
          }),
        });
        const result = await res.json();
        if (result.action !== 'ok' && result.revisedData) {
          setRefinementStatus(`Pass ${pass}: applying ${result.cutsMade?.length ?? 0} cut(s)…`);
          setGeneratedResumeData((prev: any) => ({ ...prev, data: result.revisedData }));
          if (pass < 2) {
            await new Promise((r) => setTimeout(r, 500));
            await runRefinement(pass + 1);
          }
        }
      } catch (e) {
        console.error('Vision refinement failed:', e);
      } finally {
        setIsRefining(false);
        setRefinementStatus('');
      }
    };

    setTimeout(() => runRefinement(1), 800);
  }, [generatedResumeData?.name, id]);

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
    // Scroll to top so the user sees the updated resume
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => {
    const titleElement = document.querySelector('title');
    const originalTitle = titleElement?.textContent || '';
    const printTitle = getPrintTitle();
    
    if (titleElement) titleElement.textContent = printTitle;
    
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (titleElement) titleElement.textContent = originalTitle;
      }, 100);
    }, 50);
  };

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
        <ResumeChat resumeId={id} onApplyChanges={handleApplyChanges} />
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
