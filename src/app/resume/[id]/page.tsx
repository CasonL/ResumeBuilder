'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import ResumeInnovates from '@/components/resumes/ResumeInnovates';
import ResumeTD from '@/components/resumes/ResumeTD';
import ResumeGenerated from '@/components/resumes/ResumeGenerated';

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
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('normal');

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
          const response = await fetch(`/api/resume/${id}`);
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
      const response = await fetch(`/api/resume/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: editedData, masterData: generatedResumeData.masterData })
      });
      
      if (response.ok) {
        setGeneratedResumeData({ ...generatedResumeData, data: editedData });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving resume:', error);
    }
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
    <div className="resume-viewer">
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
                    setEditedData(generatedResumeData.data);
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
                    setEditedData(generatedResumeData.data);
                  }}>
                    ↩️ Undo All
                  </button>
                  <button className="cancel-btn" onClick={() => {
                    setIsEditing(false);
                    setEditedData(null);
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

      <div className="resume-layout">
        <div className="page">
          <div className="resume-mode-wrap" data-layout={layoutMode}>
            <div className="print-only-metadata" style={{ display: 'none' }} data-resume-title={getPrintTitle()}>
              {getPrintTitle()}
            </div>
            {id === 'innovates' && <ResumeInnovates isActive={true} />}
            {id === 'td-bank' && <ResumeTD isActive={true} />}
            {generatedResumeData && (
              <ResumeGenerated 
                isActive={true} 
                data={isEditing ? editedData : generatedResumeData.data}
                masterData={generatedResumeData.masterData}
                isEditing={isEditing}
                onUpdate={setEditedData}
              />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .resume-layout {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px;
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

        .page {
          width: 100%;
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
          background: #f59e0b;
          border-color: #f59e0b;
          color: white;
        }

        .cancel-btn:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
        }

        @media print {
          .resume-layout {
            padding: 0;
            margin: 0;
          }
          
          .viewer-header {
            display: none !important;
          }

          .layout-switcher {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
