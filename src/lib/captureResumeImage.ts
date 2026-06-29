/**
 * Captures the rendered resume element as a base64 PNG with a dashed page boundary line drawn on it.
 * Temporarily applies print CSS values so the capture matches actual print output.
 */
export async function captureResumeWithBoundary(
  resumeEl: HTMLElement,
  targetPages: number
): Promise<string> {
  const html2canvas = (await import('html2canvas')).default;

  // --- Apply print CSS values temporarily ---
  const prevFontSize = resumeEl.style.fontSize;
  const prevLineHeight = resumeEl.style.lineHeight;
  resumeEl.style.fontSize = '11.5px';
  resumeEl.style.lineHeight = '1.35';
  resumeEl.style.setProperty('--resume-pad-top', '0.08in');
  resumeEl.style.setProperty('--resume-pad-x', '0.35in');
  resumeEl.style.setProperty('--resume-pad-bottom', '0.25in');
  resumeEl.style.setProperty('--resume-section-gap', '14px');
  resumeEl.style.setProperty('--resume-role-gap', '10px');
  resumeEl.style.setProperty('--resume-h2-margin-top', '9px');
  resumeEl.style.setProperty('--resume-h2-margin-bottom', '4px');

  // Let the browser reflow
  await new Promise((r) => setTimeout(r, 120));

  // --- Capture ---
  const canvas = await html2canvas(resumeEl, {
    scale: 1,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  // --- Revert CSS ---
  resumeEl.style.fontSize = prevFontSize;
  resumeEl.style.lineHeight = prevLineHeight;
  resumeEl.style.removeProperty('--resume-pad-top');
  resumeEl.style.removeProperty('--resume-pad-x');
  resumeEl.style.removeProperty('--resume-pad-bottom');
  resumeEl.style.removeProperty('--resume-section-gap');
  resumeEl.style.removeProperty('--resume-role-gap');
  resumeEl.style.removeProperty('--resume-h2-margin-top');
  resumeEl.style.removeProperty('--resume-h2-margin-bottom');

  // --- Draw page boundary line(s) ---
  // Print content area: (11in - 2x1in @page margin - 0.08in - 0.25in) * 96dpi * scale
  // = 8.67in * 96 * 1.5 = 1249px at 1.5x capture scale
  const PRINT_PAD_TOP_PX = Math.round(0.08 * 96 * 1);
  const CONTENT_PER_PAGE_PX = Math.round(8.67 * 96 * 1);

  const ctx = canvas.getContext('2d')!;

  for (let page = 1; page <= targetPages; page++) {
    const lineY = PRINT_PAD_TOP_PX + CONTENT_PER_PAGE_PX * page;
    if (lineY > canvas.height) break;

    // Dashed red boundary line
    ctx.save();
    ctx.setLineDash([12, 6]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(canvas.width, lineY);
    ctx.stroke();

    // Label
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`— PAGE ${page} BOUNDARY —`, 12, lineY - 5);
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}
