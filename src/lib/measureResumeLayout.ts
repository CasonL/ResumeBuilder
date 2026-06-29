/**
 * Estimates resume print-mode height from first principles using character counts.
 * Avoids scrollHeight (which reads screen CSS, not print CSS) for accuracy.
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

// Print-mode metrics (font: 11.5px, line-height: 1.35)
const LINE_PX = 11.5 * 1.35;   // ~15.5px per line of body text
const CHARS_PER_LINE = 90;      // characters per line at content width
const PAGE_H = 832;             // 8.67in × 96dpi usable content

// Fixed-height building blocks (derived from actual globals.css values)
// h2: 13px × 1.35 line-height ≈ 17.6px text + 6px padding-bottom + 12px margin-bottom = 35px
// role-head <b>: font-size 15px × 1.35 ≈ 20px + 6px margin-bottom (--resume-rolehead-gap) = 26px
// skill pill: 12px font + 5px×2 padding = 22px; category label ~18px + 8px margin-top on grid
const H_HEADER       = 82;  // name (30px→36px) + tagline (13px) + contact (12px) + border/gap
const H_SUMMARY      = 10;  // top margin before summary text
const H_SECTION_H2   = 35;  // h2: text 17.6px + padding-bottom 6px + margin-bottom 12px ≈ 35px
const H_SECTION_GAP  = 14;  // margin-bottom of section containers at print
const H_ROLE_HEAD    = 28;  // 15px bold text (~20px line) + 6px margin + 2px extra
const H_ROLE_GAP     = 10;  // gap between roles within a section
const H_BULLET_PAD   = 5;   // top margin per bullet li
const H_EDUCATION    = 36;  // degree + focus line
const H_SKILL_CAT    = 46;  // category label (~18px) + 8px margin + one row of pills (22px)
const H_CERT_ENTRY   = 36;  // cert entry (often wraps to 2 lines)

function lines(text: string): number {
  return Math.ceil(text.length / CHARS_PER_LINE);
}

function bulletH(text: string): number {
  return lines(text) * LINE_PX + H_BULLET_PAD;
}

export async function measureResumeLayout(
  _el: HTMLElement,
  resumeData: any,
  masterData: any
): Promise<LayoutReport> {
  const hidden: string[] = resumeData.customizations?.hiddenSections || [];
  const hide = (s: string) => hidden.includes(s);

  let h = H_HEADER;

  // Summary
  const summary = resumeData.customizations?.summary ?? masterData?.personalInfo?.summary;
  if (summary && !hide('summary')) {
    h += H_SUMMARY + lines(summary) * LINE_PX + H_SECTION_GAP;
  }

  // Education
  if (!hide('education') && masterData?.education?.length) {
    h += H_SECTION_H2 + H_EDUCATION + H_SECTION_GAP;
  }

  // Helper: build roles for a section
  const buildSection = (selectedIds: string[], pool: any[], sectionKey: string) => {
    if (hide(sectionKey) || !selectedIds?.length) return 0;
    let sh = H_SECTION_H2;
    selectedIds.forEach((id: string, idx: number) => {
      const item = pool.find((x: any) => x.id === id);
      if (!item) return;
      const bullets: string[] =
        resumeData.customizations?.bulletPointAdjustments?.[id] || item.bullets || [];
      sh += H_ROLE_HEAD;
      bullets.forEach((b: string) => { sh += bulletH(b); });
      if (idx < selectedIds.length - 1) sh += H_ROLE_GAP;
    });
    sh += H_SECTION_GAP;
    return sh;
  };

  const allExp  = masterData?.experiences || [];
  const allLead = masterData?.leadership   || [];
  h += buildSection(resumeData.selectedExperiences, allExp,  'experience');
  h += buildSection(resumeData.selectedLeadership,  allLead, 'leadership');

  // Projects
  if (!hide('projects') && resumeData.selectedProjects?.length) {
    const proj = masterData?.projects || [];
    const resolved = resumeData.selectedProjects.filter((id: string) => proj.find((p: any) => p.id === id));
    if (resolved.length) {
      h += H_SECTION_H2;
      resolved.forEach((id: string) => {
        const p = proj.find((x: any) => x.id === id);
        const bullets = resumeData.customizations?.bulletPointAdjustments?.[id] || p?.bullets || [];
        h += H_ROLE_HEAD;
        bullets.forEach((b: string) => { h += bulletH(b); });
      });
      h += H_SECTION_GAP;
    }
  }

  // Skills
  if (!hide('skills') && resumeData.selectedSkills?.length) {
    const normalized = typeof resumeData.selectedSkills[0] === 'string'
      ? [{ category: 'Skills', items: resumeData.selectedSkills }]
      : resumeData.selectedSkills;
    h += H_SECTION_H2 + normalized.length * H_SKILL_CAT + H_SECTION_GAP;
  }

  // Certifications
  if (!hide('certifications') && masterData?.certifications?.length) {
    h += H_SECTION_H2 + masterData.certifications.length * H_CERT_ENTRY + H_SECTION_GAP;
  }

  // Build role list for AI
  const allIds = [
    ...(resumeData.selectedExperiences || []),
    ...(resumeData.selectedLeadership  || []),
  ];
  const allItems = [...allExp, ...allLead];
  const roles: RoleMeasurement[] = allIds.map((id: string) => {
    const item = allItems.find((x: any) => x.id === id);
    const bTexts: string[] =
      resumeData.customizations?.bulletPointAdjustments?.[id] || item?.bullets || [];
    const bullets: BulletMeasurement[] = bTexts.map((text) => ({
      text,
      heightPx: bulletH(text),
      charCount: text.length,
      estimatedLines: lines(text),
    }));
    return {
      id,
      role: resumeData.customizations?.roleAdjustments?.[id]?.role || item?.role || id,
      company: resumeData.customizations?.roleAdjustments?.[id]?.company || item?.company || '',
      bullets,
      totalHeightPx: bullets.reduce((s, b) => s + b.heightPx, 0),
    };
  });

  return {
    totalHeightPx: Math.round(h),
    pageHeightPx: PAGE_H,
    overflowPx: Math.max(0, Math.round(h - PAGE_H)),
    roles,
  };
}
