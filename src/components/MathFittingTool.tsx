'use client';

import { useState } from 'react';
import { ResumePageCalculator } from '@/lib/resume-calculator';

interface Props {
  resumeId: string;
}

export default function MathFittingTool({ resumeId }: Props) {
  const [targetPages, setTargetPages] = useState<1 | 2>(1);
  const [result, setResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const calculate = () => {
    setCalculating(true);
    
    try {
      const calculator = new ResumePageCalculator(targetPages);
      const analysis = calculator.analyze(resumeId);
      
      if (analysis) {
        setResult(analysis);
      } else {
        alert('Could not find resume element');
      }
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setCalculating(false);
    }
  };

  const applyCSS = () => {
    if (!result?.css) return;
    
    let styleEl = document.getElementById('dynamic-resume-styles') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-resume-styles';
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = result.css;
    alert('CSS applied! Check print preview (Ctrl+P)');
  };

  return (
    <div className="math-fitting-tool">
      <div className="tool-header">
        <h3>📐 Mathematical Page Fitter</h3>
        <p>Calculates exact element heights and generates optimal CSS</p>
      </div>

      <div className="page-selector">
        <button
          className={targetPages === 1 ? 'active' : ''}
          onClick={() => setTargetPages(1)}
        >
          1 Page
        </button>
        <button
          className={targetPages === 2 ? 'active' : ''}
          onClick={() => setTargetPages(2)}
        >
          2 Pages
        </button>
      </div>

      <button className="calculate-btn" onClick={calculate} disabled={calculating}>
        {calculating ? 'Calculating...' : 'Calculate Optimal Fit'}
      </button>

      {result && (
        <div className="results">
          <div className="metrics">
            <h4>📊 Analysis</h4>
            <div className="metric-grid">
              <div className="metric">
                <span className="label">Target Height:</span>
                <span className="value">{result.targetHeight}px ({targetPages} page{targetPages > 1 ? 's' : ''})</span>
              </div>
              <div className="metric">
                <span className="label">Estimated Height:</span>
                <span className="value">{Math.round(result.estimatedHeight)}px</span>
              </div>
              <div className="metric">
                <span className="label">Fit:</span>
                <span className={`value ${result.estimatedHeight <= result.targetHeight ? 'good' : 'bad'}`}>
                  {((result.estimatedHeight / result.targetHeight) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="metric">
                <span className="label">Actual Total (Print Mode):</span>
                <span className="value">{Math.round(result.actualTotalHeight)}px</span>
              </div>
              <div className="metric">
                <span className="label">Scale Factor:</span>
                <span className="value">{(result.scaleFactor * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="warning-box">
              💡 <strong>Print Mode Measurement:</strong> Header measured at {Math.round(result.actualHeaderHeight)}px in PDF render
            </div>

            <h4>🔢 Element Count</h4>
            <div className="element-count">
              <div>Headers: {result.elements.h2Sections}</div>
              <div>Bullet Points: {result.elements.bulletPoints}</div>
              <div>Role Sections: {result.elements.roleHeaders}</div>
              <div>Skill Chips: {result.elements.skillChips}</div>
            </div>

            <h4>⚙️ Optimal Configuration</h4>
            <div className="config-preview">
              <div>Name: {result.optimalConfig.fontSize.name}px</div>
              <div>Bullets: {result.optimalConfig.fontSize.bullet}px @ {result.optimalConfig.lineHeight.bullet} line-height</div>
              <div>H2 Margin: {result.optimalConfig.margin.h2.top}px / {result.optimalConfig.margin.h2.bottom}px</div>
              <div>Padding: {Math.round(result.optimalConfig.margin.topPadding)}px</div>
            </div>
          </div>

          <div className="css-output">
            <h4>📄 Generated CSS</h4>
            <pre>{result.css}</pre>
            <button className="apply-btn" onClick={applyCSS}>
              Apply CSS to Page
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .math-fitting-tool {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px;
          height: fit-content;
          position: sticky;
          top: 20px;
        }

        @media print {
          .math-fitting-tool {
            display: none !important;
          }
        }

        .tool-header h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: var(--text);
        }

        .tool-header p {
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

        .calculate-btn {
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

        .calculate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .results {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .metrics {
          background: rgba(0, 0, 0, 0.2);
          padding: 16px;
          border-radius: 8px;
        }

        .metrics h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--text);
        }

        .metric-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 20px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
        }

        .metric .label {
          font-weight: 600;
          color: var(--muted);
          font-size: 13px;
        }

        .metric .value {
          font-weight: 700;
          color: var(--text);
          font-size: 14px;
        }

        .metric .value.good {
          color: #4ade80;
        }

        .metric .value.bad {
          color: #f87171;
        }

        .element-count {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 13px;
          color: var(--muted);
        }

        .config-preview {
          display: grid;
          gap: 6px;
          font-size: 13px;
          color: var(--muted);
          font-family: 'Courier New', monospace;
        }

        .warning-box {
          background: rgba(255, 200, 100, 0.2);
          border: 1px solid rgba(255, 200, 100, 0.5);
          padding: 12px;
          border-radius: 8px;
          margin: 16px 0;
          font-size: 13px;
          color: var(--text);
        }

        .warning-box strong {
          color: #ffa500;
        }

        .css-output {
          background: rgba(0, 0, 0, 0.3);
          padding: 16px;
          border-radius: 8px;
        }

        .css-output h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: var(--text);
        }

        .css-output pre {
          background: rgba(0, 0, 0, 0.4);
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          font-size: 12px;
          color: #a5d6ff;
          line-height: 1.5;
          max-height: 300px;
          overflow-y: auto;
        }

        .apply-btn {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          background: #4ade80;
          color: #000;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        }

        .apply-btn:hover {
          background: #22c55e;
        }
      `}</style>
    </div>
  );
}
