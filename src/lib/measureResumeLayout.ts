/**
 * Applies print CSS to the resume element, measures actual rendered heights,
 * then reverts. Returns a structured layout report the AI can act on.
 */
export interface BulletMeasurement {
  text: string;
  heightPx: number;
  charCount: number;
  estimatedLines: number;
}

export interface RoleMeasurement {
  id: string;
  role: string;
  company: string;
  bullets: BulletMeasurement[];
  totalHeightPx: number;
}

export interface LayoutReport {
  totalHeightPx: number;
  pageHeightPx: number;
  overflowPx: number;
  roles: RoleMeasurement[];
}

const PRINT_FONT_PX = 11.5;
const PAGE_CONTENT_HEIGHT_PX = 832; // 8.67in * 96dpi
const CHARS_PER_LINE = 92;

function estimateLines(text: string): number {
  return Math.ceil(text.length / CHARS_PER_LINE);
}

export async function measureResumeLayout(
  resumeEl: HTMLElement,
  resumeData: any,
  masterData: any
): Promise<LayoutReport> {
  // --- Apply print CSS ---
  const prev = {
    fontSize: resumeEl.style.fontSize,
    lineHeight: resumeEl.style.lineHeight,
  };
  resumeEl.style.fontSize = `${PRINT_FONT_PX}px`;
  resumeEl.style.lineHeight = '1.35';
  resumeEl.style.setProperty('--resume-pad-top', '0.08in');
  resumeEl.style.setProperty('--resume-pad-x', '0.35in');
  resumeEl.style.setProperty('--resume-pad-bottom', '0.25in');
  resumeEl.style.setProperty('--resume-section-gap', '14px');
  resumeEl.style.setProperty('--resume-role-gap', '10px');

  await new Promise((r) => setTimeout(r, 150));
  const totalHeightPx = resumeEl.scrollHeight;

  // --- Revert ---
  resumeEl.style.fontSize = prev.fontSize;
  resumeEl.style.lineHeight = prev.lineHeight;
  resumeEl.style.removeProperty('--resume-pad-top');
  resumeEl.style.removeProperty('--resume-pad-x');
  resumeEl.style.removeProperty('--resume-pad-bottom');
  resumeEl.style.removeProperty('--resume-section-gap');
  resumeEl.style.removeProperty('--resume-role-gap');

  // --- Build role measurements from JSON data ---
  const allIds = [
    ...(resumeData.selectedExperiences || []),
    ...(resumeData.selectedLeadership || []),
  ];
  const allItems = [
    ...(masterData?.experiences || []),
    ...(masterData?.leadership || []),
  ];

  const roles: RoleMeasurement[] = allIds.map((id: string) => {
    const item = allItems.find((x: any) => x.id === id);
    const adjustedBullets: string[] =
      resumeData.customizations?.bulletPointAdjustments?.[id] ||
      item?.bullets ||
      [];

    const bullets: BulletMeasurement[] = adjustedBullets.map((text: string) => {
      const lines = estimateLines(text);
      return {
        text,
        heightPx: lines * PRINT_FONT_PX * 1.35,
        charCount: text.length,
        estimatedLines: lines,
      };
    });

    return {
      id,
      role: resumeData.customizations?.roleAdjustments?.[id]?.role || item?.role || id,
      company: resumeData.customizations?.roleAdjustments?.[id]?.company || item?.company || '',
      bullets,
      totalHeightPx: bullets.reduce((s, b) => s + b.heightPx, 0),
    };
  });

  return {
    totalHeightPx,
    pageHeightPx: PAGE_CONTENT_HEIGHT_PX,
    overflowPx: Math.max(0, totalHeightPx - PAGE_CONTENT_HEIGHT_PX),
    roles,
  };
}
