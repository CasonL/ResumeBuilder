'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import ResumeInnovates from './resumes/ResumeInnovates';
import ResumeTD from './resumes/ResumeTD';
import MathFittingTool from './MathFittingTool';

type ResumeKey = 'innovates' | 'td';

export default function ResumesPage() {
  const [which, setWhich] = useState<ResumeKey>('innovates');

  const title = useMemo(() => {
    return which === 'innovates'
      ? 'Cason Lamothe | Resume (Alberta Innovates)'
      : 'Cason Lamothe | Resume (TD Bank)';
  }, [which]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  const onPrint = useCallback(() => {
    window.print();
  }, []);

  const isInnovates = which === 'innovates';

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>Resumes</h1>
          <p className="sub">Two variants. Same person. One browser print dialog away from PDF.</p>
        </div>

        <div className="controls">
          <div className="tabs" role="tablist" aria-label="Resume selector">
            <button
              id="tab-innovates"
              className={isInnovates ? 'active' : undefined}
              type="button"
              role="tab"
              aria-selected={isInnovates}
              onClick={() => setWhich('innovates')}
            >
              Alberta Innovates
            </button>
            <button
              id="tab-td"
              className={!isInnovates ? 'active' : undefined}
              type="button"
              role="tab"
              aria-selected={!isInnovates}
              onClick={() => setWhich('td')}
            >
              TD Bank
            </button>
          </div>
          <button id="print-btn" type="button" title="Print the currently visible resume" onClick={onPrint}>
            Print PDF
          </button>
        </div>
      </header>

      <div className="hint">Tip: In the print dialog, choose “Save as PDF”.</div>

      <MathFittingTool resumeId={`resume-${which}`} />

      <main className="page">
        <ResumeInnovates isActive={isInnovates} />
        <ResumeTD isActive={!isInnovates} />
      </main>
    </div>
  );
}
