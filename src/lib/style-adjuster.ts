import { PDFMeasurement } from './pdf-utils';

export interface StyleAdjustment {
  fontSize: number;        // Base font size in pt
  lineHeight: number;      // Line height multiplier
  sectionGap: number;      // Gap between sections in px
  h2MarginTop: number;     // H2 top margin in px
  h2MarginBottom: number;  // H2 bottom margin in px
  textMargin: number;      // Paragraph/list item margin in px
  listMarginTop: number;   // List top margin in px
  listMarginBottom: number; // List bottom margin in px
  roleGap: number;         // Gap between roles in px
  padTop: number;          // Top padding in px
  padBottom: number;       // Bottom padding in px
}

export interface AdjustmentResult {
  html: string;
  styles: StyleAdjustment;
  reasoning: string;
}

// Base style configurations matching your layout modes
const BASE_STYLES: Record<'compressed' | 'normal' | 'spacious', StyleAdjustment> = {
  compressed: {
    fontSize: 10,
    lineHeight: 1.35,
    sectionGap: 12,
    h2MarginTop: 8,
    h2MarginBottom: 3,
    textMargin: 2.5,
    listMarginTop: 3,
    listMarginBottom: 5,
    roleGap: 8,
    padTop: 10,
    padBottom: 20,
  },
  normal: {
    fontSize: 10.5,
    lineHeight: 1.4,
    sectionGap: 14,
    h2MarginTop: 9,
    h2MarginBottom: 4,
    textMargin: 3,
    listMarginTop: 4,
    listMarginBottom: 6,
    roleGap: 10,
    padTop: 12,
    padBottom: 24,
  },
  spacious: {
    fontSize: 11,
    lineHeight: 1.45,
    sectionGap: 16,
    h2MarginTop: 10,
    h2MarginBottom: 5,
    textMargin: 3.5,
    listMarginTop: 5,
    listMarginBottom: 7,
    roleGap: 12,
    padTop: 14,
    padBottom: 28,
  },
};

function calculateAdjustmentFactor(
  currentPages: number,
  targetPages: number,
  overflow: boolean,
  overflowAmount?: number
): number | null {
  if (currentPages === targetPages && !overflow) {
    return 1.0; // Perfect fit
  }

  const pagesDiff = currentPages - targetPages;
  
  if (overflow && overflowAmount) {
    // Small overflow - make minor adjustment
    const overflowRatio = overflowAmount / 1056; // 11 inches * 96 DPI
    return 1.0 - (overflowRatio * 0.15); // Reduce by up to 15%
  }

  if (pagesDiff > 0) {
    // Too many pages - shrink
    return 1.0 - (pagesDiff * 0.08); // 8% reduction per extra page
  } else {
    // Too few pages - would need to expand
    const expansionNeeded = Math.abs(pagesDiff) * 0.06;
    
    // Don't allow expansion beyond 3% - content is insufficient
    if (expansionNeeded > 0.03) {
      return null; // Signal insufficient content
    }
    
    return 1.0 + expansionNeeded;
  }
}

function applyAdjustmentFactor(
  baseStyles: StyleAdjustment,
  factor: number
): StyleAdjustment {
  return {
    fontSize: Math.max(8, Math.min(12, baseStyles.fontSize * factor)),
    lineHeight: Math.max(1.2, Math.min(1.6, baseStyles.lineHeight * factor)),
    sectionGap: Math.max(8, Math.round(baseStyles.sectionGap * factor)),
    h2MarginTop: Math.max(4, Math.round(baseStyles.h2MarginTop * factor)),
    h2MarginBottom: Math.max(2, Math.round(baseStyles.h2MarginBottom * factor)),
    textMargin: Math.max(1, Math.round(baseStyles.textMargin * factor * 10) / 10),
    listMarginTop: Math.max(2, Math.round(baseStyles.listMarginTop * factor)),
    listMarginBottom: Math.max(3, Math.round(baseStyles.listMarginBottom * factor)),
    roleGap: Math.max(6, Math.round(baseStyles.roleGap * factor)),
    padTop: Math.max(8, Math.round(baseStyles.padTop * factor)),
    padBottom: Math.max(16, Math.round(baseStyles.padBottom * factor)),
  };
}

function injectStyles(htmlContent: string, styles: StyleAdjustment): string {
  // Create inline style block with adjusted values
  const styleBlock = `
    <style>
      .resume {
        font-size: ${styles.fontSize}pt !important;
        line-height: ${styles.lineHeight} !important;
        padding: ${styles.padTop}px 30px ${styles.padBottom}px 30px !important;
      }
      .resume h2 {
        margin: ${styles.h2MarginTop}px 0 ${styles.h2MarginBottom}px !important;
      }
      .resume p,
      .resume li,
      .resume .summary-text {
        margin: ${styles.textMargin}px 0 !important;
      }
      .resume ul {
        margin: ${styles.listMarginTop}px 0 ${styles.listMarginBottom}px 0 !important;
      }
      .resume .role,
      .resume .role-head {
        margin-bottom: ${styles.roleGap}px !important;
      }
      .resume section,
      .resume .summary-section {
        margin-bottom: ${styles.sectionGap}px !important;
      }
    </style>
  `;

  // Inject before closing </head> or at start of body
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', `${styleBlock}</head>`);
  } else if (htmlContent.includes('<body')) {
    return htmlContent.replace(/<body[^>]*>/, (match) => `${match}${styleBlock}`);
  } else {
    // No head or body tags, prepend to content
    return styleBlock + htmlContent;
  }
}

export function adjustResumeStyles(
  htmlContent: string,
  measurement: PDFMeasurement,
  targetPages: number,
  currentLayoutMode: 'compressed' | 'normal' | 'spacious' = 'normal'
): AdjustmentResult | null {
  const baseStyles = BASE_STYLES[currentLayoutMode];
  
  const adjustmentFactor = calculateAdjustmentFactor(
    measurement.pageCount,
    targetPages,
    measurement.overflow,
    measurement.overflowAmount
  );

  // If adjustmentFactor is null, content is insufficient for target pages
  if (adjustmentFactor === null) {
    return null;
  }

  const adjustedStyles = applyAdjustmentFactor(baseStyles, adjustmentFactor);
  const adjustedHtml = injectStyles(htmlContent, adjustedStyles);

  const reasoning = `Starting from ${currentLayoutMode} layout (${measurement.pageCount} pages), ` +
    `applied ${(adjustmentFactor * 100).toFixed(1)}% adjustment factor to fit ${targetPages} page(s). ` +
    `Font: ${adjustedStyles.fontSize}pt, Line height: ${adjustedStyles.lineHeight}`;

  return {
    html: adjustedHtml,
    styles: adjustedStyles,
    reasoning,
  };
}

export function getBaseStylesForLayout(
  layoutMode: 'compressed' | 'normal' | 'spacious' = 'normal'
): StyleAdjustment {
  return { ...BASE_STYLES[layoutMode] };
}
