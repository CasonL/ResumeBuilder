'use client';

import { useState, useEffect } from 'react';

interface PageFittingControlProps {
  resumeHtml: string;
  onFitted?: (fittedHtml: string) => void;
  layoutMode?: 'compressed' | 'normal' | 'spacious';
}

export default function PageFittingControl({ resumeHtml, onFitted, layoutMode = 'normal' }: PageFittingControlProps) {
  const [targetPages, setTargetPages] = useState<1 | 2>(1);
  const [isFitting, setIsFitting] = useState(false);
  const [twoPageLocked, setTwoPageLocked] = useState(false);
  const [checkingContent, setCheckingContent] = useState(false);
  const [fittingProgress, setFittingProgress] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    checkContentSufficiency();
  }, [resumeHtml]);

  const checkContentSufficiency = async () => {
    setCheckingContent(true);
    try {
      const response = await fetch('/api/check-content-sufficiency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeHtml }),
      });
      const data = await response.json();
      setTwoPageLocked(!data.canFillTwoPages);
    } catch (error) {
      console.error('Failed to check content sufficiency:', error);
    } finally {
      setCheckingContent(false);
    }
  };

  const fitToPages = async () => {
    setIsFitting(true);
    setFittingProgress([]);
    setResult(null);

    try {
      const response = await fetch('/api/fit-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeHtml,
          targetPages,
          maxIterations: 5,
          layoutMode,
        }),
      });

      const data = await response.json();
      setResult(data);
      setFittingProgress(data.adjustmentHistory || []);

      if (data.insufficientContent) {
        // Content is too short for target pages
        alert(data.message);
      } else if (data.success && onFitted) {
        onFitted(data.finalHtml);
        generatePdfPreview(data.finalHtml);
      } else if (data.finalHtml) {
        // Partial success - show preview anyway
        generatePdfPreview(data.finalHtml);
      }
    } catch (error) {
      console.error('Fitting error:', error);
    } finally {
      setIsFitting(false);
    }
  };

  const generatePdfPreview = async (html: string) => {
    try {
      const response = await fetch('/api/preview-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeHtml: html }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
      }
    } catch (error) {
      console.error('PDF preview error:', error);
    }
  };

  return (
    <div className="page-fitting-control">
      <div className="fitting-header">
        <h3>Page Fitting</h3>
        <p className="fitting-description">
          Automatically adjust font sizes and spacing to fit exactly on 1 or 2 pages
        </p>
      </div>

      <div className="page-selector">
        <button
          className={targetPages === 1 ? 'active' : ''}
          onClick={() => setTargetPages(1)}
          disabled={isFitting}
        >
          1 Page
        </button>
        <button
          className={targetPages === 2 ? 'active' : ''}
          onClick={() => setTargetPages(2)}
          disabled={isFitting || twoPageLocked}
          title={twoPageLocked ? 'Not enough content for 2 pages' : ''}
        >
          2 Pages {twoPageLocked && '🔒'}
        </button>
      </div>

      {twoPageLocked && (
        <p className="warning-message">
          ⚠️ Insufficient content for 2-page format. Add more experience or projects to unlock.
        </p>
      )}

      <button
        className="fit-button"
        onClick={fitToPages}
        disabled={isFitting || checkingContent}
      >
        {isFitting ? 'Fitting Resume...' : `Fit to ${targetPages} Page${targetPages > 1 ? 's' : ''}`}
      </button>

      {isFitting && (
        <div className="progress-indicator">
          <div className="spinner"></div>
          <p>AI is adjusting content to fit {targetPages} page(s)...</p>
          {fittingProgress.length > 0 && (
            <div className="progress-log">
              {fittingProgress.map((item, idx) => (
                <div key={idx} className="progress-item">
                  Iteration {item.iteration}: {item.pageCount} page(s) 
                  {item.overflow && ` (overflow: ${item.overflow}px)`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {result && (
        <div className={`result-panel ${result.success ? 'success' : 'warning'}`}>
          <h4>{result.success ? '✓ Perfect Fit!' : '⚠ Partial Fit'}</h4>
          <p>{result.message}</p>
          <p className="result-meta">
            Completed in {result.iterations} iteration(s)
          </p>
        </div>
      )}

      {pdfPreviewUrl && (
        <div className="pdf-preview-section">
          <h4>PDF Preview</h4>
          <iframe
            src={pdfPreviewUrl}
            className="pdf-preview"
            title="Resume PDF Preview"
          />
          <a href={pdfPreviewUrl} download="resume.pdf" className="download-link">
            Download PDF
          </a>
        </div>
      )}

      <style jsx>{`
        .page-fitting-control {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }

        .fitting-header h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: var(--text);
        }

        .fitting-description {
          margin: 0 0 20px 0;
          color: var(--muted);
          font-size: 14px;
        }

        .page-selector {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .page-selector button {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
        }

        .page-selector button.active {
          background: var(--accent);
          color: white;
        }

        .page-selector button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .warning-message {
          background: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .fit-button {
          width: 100%;
          padding: 14px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        }

        .fit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .progress-indicator {
          margin-top: 20px;
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--line);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .progress-log {
          margin-top: 12px;
          text-align: left;
          background: rgba(0,0,0,0.2);
          padding: 12px;
          border-radius: 8px;
          font-size: 13px;
          max-height: 150px;
          overflow-y: auto;
        }

        .progress-item {
          padding: 4px 0;
          color: var(--muted);
        }

        .result-panel {
          margin-top: 20px;
          padding: 16px;
          border-radius: 8px;
        }

        .result-panel.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .result-panel.warning {
          background: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
        }

        .result-panel h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .result-panel p {
          margin: 4px 0;
          font-size: 14px;
        }

        .result-meta {
          color: inherit;
          opacity: 0.8;
          font-size: 13px !important;
        }

        .pdf-preview-section {
          margin-top: 24px;
          border-top: 1px solid var(--line);
          padding-top: 24px;
        }

        .pdf-preview-section h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: var(--text);
        }

        .pdf-preview {
          width: 100%;
          height: 600px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: white;
        }

        .download-link {
          display: inline-block;
          margin-top: 12px;
          padding: 10px 20px;
          background: var(--accent);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
        }

        .download-link:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
