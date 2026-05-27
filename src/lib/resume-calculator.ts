interface ElementMetrics {
  baseHeight: number;
  marginTop: number;
  marginBottom: number;
  paddingTop: number;
  paddingBottom: number;
}

interface ResumeElements {
  header: number;
  h2Sections: number;
  bulletPoints: number;
  roleHeaders: number;
  skillChips: number;
  paragraphs: number;
  footer: number;
}

interface SpacingConfig {
  fontSize: {
    name: number;
    tagline: number;
    h2: number;
    bullet: number;
    chip: number;
    small: number;
  };
  lineHeight: {
    tagline: number;
    bullet: number;
  };
  margin: {
    topPadding: number;
    bottomPadding: number;
    topSection: { bottom: number; top: number };
    h2: { top: number; bottom: number };
    bullet: { top: number; bottom: number };
    role: { bottom: number };
    aside: { h2: number };
    footer: { top: number; topPadding: number };
  };
  padding: {
    chip: { vertical: number; horizontal: number };
  };
}

export class ResumePageCalculator {
  private pageHeight: number = 11 * 96; // Letter: 11 inches at 96 DPI
  private targetPages: number;
  
  constructor(targetPages: 1 | 2 = 1) {
    this.targetPages = targetPages;
  }

  calculateElementHeight(
    fontSize: number,
    lineHeight: number,
    marginTop: number = 0,
    marginBottom: number = 0,
    paddingTop: number = 0,
    paddingBottom: number = 0
  ): number {
    return fontSize * lineHeight + marginTop + marginBottom + paddingTop + paddingBottom;
  }

  countElements(resumeId: string): ResumeElements | null {
    if (typeof window === 'undefined') return null;
    
    let resume = document.getElementById(resumeId);
    // Fallback: find any .resume element if ID not found
    if (!resume) {
      resume = document.querySelector('.resume.show, .resume.print') as HTMLElement;
    }
    if (!resume) return null;

    return {
      header: 1,
      h2Sections: resume.querySelectorAll('h2').length,
      bulletPoints: resume.querySelectorAll('li').length,
      roleHeaders: resume.querySelectorAll('.role').length,
      skillChips: resume.querySelectorAll('.chip, .skill-item').length,
      paragraphs: resume.querySelectorAll('p:not(.name):not(.tagline):not(.small):not(.resume-name):not(.resume-title)').length,
      footer: 1,
    };
  }

  measureInPrintMode(resumeId: string): { headerHeight: number; totalHeight: number } {
    if (typeof window === 'undefined') return { headerHeight: 200, totalHeight: 1000 };
    
    let resume = document.getElementById(resumeId);
    // Fallback: find any .resume element if ID not found
    if (!resume) {
      resume = document.querySelector('.resume.show, .resume.print') as HTMLElement;
    }
    if (!resume) return { headerHeight: 200, totalHeight: 1000 };

    // Create hidden container with print styles
    const printContainer = document.createElement('div');
    printContainer.style.position = 'absolute';
    printContainer.style.left = '-9999px';
    printContainer.style.width = '8.5in'; // Letter width
    printContainer.style.padding = '0.35in 0.45in'; // Print padding
    printContainer.style.background = 'white';
    
    // Clone resume and apply to container
    const clone = resume.cloneNode(true) as HTMLElement;
    printContainer.appendChild(clone);
    document.body.appendChild(printContainer);

    // Wait for render
    const measurements = {
      headerHeight: 200,
      totalHeight: 1000
    };

    try {
      // Force reflow
      printContainer.offsetHeight;
      
      // Measure header
      const topSection = clone.querySelector('.top, .resume-header');
      if (topSection) {
        measurements.headerHeight = (topSection as HTMLElement).offsetHeight;
      }
      
      // Measure total
      measurements.totalHeight = clone.offsetHeight;
    } finally {
      document.body.removeChild(printContainer);
    }

    return measurements;
  }

  calculateTotalHeight(elements: ResumeElements, config: SpacingConfig, measurements?: { headerHeight: number; totalHeight: number }): number {
    let total = 0;

    // Top and bottom padding
    total += config.margin.topPadding + config.margin.bottomPadding;

    // Header - use actual measurement if available
    const headerHeight = measurements?.headerHeight || 200;
    total += headerHeight;

    // H2 sections
    total += elements.h2Sections * this.calculateElementHeight(
      config.fontSize.h2,
      1,
      config.margin.h2.top,
      config.margin.h2.bottom
    );

    // Bullet points
    total += elements.bulletPoints * this.calculateElementHeight(
      config.fontSize.bullet,
      config.lineHeight.bullet,
      config.margin.bullet.top,
      config.margin.bullet.bottom
    );

    // Role headers
    total += elements.roleHeaders * (14 + config.margin.role.bottom); // Approximate role header height

    // Skills chips (estimated: 2 rows typically)
    const chipHeight = config.fontSize.chip + (config.padding.chip.vertical * 2);
    const chipsPerRow = 4; // Estimated
    const rows = Math.ceil(elements.skillChips / chipsPerRow);
    total += rows * chipHeight + (rows - 1) * 5; // Gap between rows

    // Footer
    total += this.calculateElementHeight(
      config.fontSize.small,
      1,
      config.margin.footer.top,
      0,
      config.margin.footer.topPadding,
      0
    );

    // Aside H2 spacing
    total += (elements.h2Sections - 1) * config.margin.aside.h2;

    return total;
  }

  optimizeSpacing(elements: ResumeElements, measurements?: { headerHeight: number; totalHeight: number }): SpacingConfig {
    const targetHeight = this.targetPages * this.pageHeight;
    
    // If we have actual measurements, use them as starting point
    if (measurements && measurements.totalHeight > 0) {
      const currentActualHeight = measurements.totalHeight;
      const scaleFactor = Math.min(0.98, targetHeight / currentActualHeight);
      
      return {
        fontSize: {
          name: Math.round(24 * scaleFactor * 10) / 10,
          tagline: Math.round(12 * scaleFactor * 10) / 10,
          h2: Math.round(11 * scaleFactor * 10) / 10,
          bullet: Math.round(12 * scaleFactor * 10) / 10,
          chip: Math.round(11 * scaleFactor * 10) / 10,
          small: Math.round(11 * scaleFactor * 10) / 10,
        },
        lineHeight: {
          tagline: Math.max(1.2, 1.3 * scaleFactor),
          bullet: Math.max(1.2, 1.35 * scaleFactor),
        },
        margin: {
          topPadding: Math.round(24 * scaleFactor),
          bottomPadding: Math.round(24 * scaleFactor),
          topSection: { bottom: Math.round(10 * scaleFactor), top: 0 },
          h2: { top: Math.round(12 * scaleFactor), bottom: Math.round(6 * scaleFactor) },
          bullet: { top: Math.round(3 * scaleFactor), bottom: Math.round(3 * scaleFactor) },
          role: { bottom: Math.round(12 * scaleFactor) },
          aside: { h2: Math.round(12 * scaleFactor) },
          footer: { top: Math.round(10 * scaleFactor), topPadding: Math.round(6 * scaleFactor) },
        },
        padding: {
          chip: { vertical: Math.round(3 * scaleFactor), horizontal: 7 },
        },
      };
    }
    
    // Start with current values and iterate to find optimal fit
    let config: SpacingConfig = {
      fontSize: {
        name: 24,
        tagline: 12,
        h2: 11,
        bullet: 12,
        chip: 11,
        small: 11,
      },
      lineHeight: {
        tagline: 1.3,
        bullet: 1.35,
      },
      margin: {
        topPadding: 24,
        bottomPadding: 24,
        topSection: { bottom: 10, top: 0 },
        h2: { top: 12, bottom: 6 },
        bullet: { top: 3, bottom: 3 },
        role: { bottom: 12 },
        aside: { h2: 12 },
        footer: { top: 10, topPadding: 6 },
      },
      padding: {
        chip: { vertical: 3, horizontal: 7 },
      },
    };

    let currentHeight = this.calculateTotalHeight(elements, config, measurements);
    const tolerance = 50; // 50px tolerance

    // If we're over, reduce spacing proportionally
    if (currentHeight > targetHeight) {
      const scaleFactor = (targetHeight - tolerance) / currentHeight;
      
      config.margin.topPadding *= scaleFactor;
      config.margin.bottomPadding *= scaleFactor;
      config.margin.h2.top *= scaleFactor;
      config.margin.h2.bottom *= scaleFactor;
      config.margin.bullet.top *= scaleFactor;
      config.margin.bullet.bottom *= scaleFactor;
      config.margin.role.bottom *= scaleFactor;
      config.margin.aside.h2 *= scaleFactor;
      config.fontSize.bullet *= Math.max(0.95, scaleFactor); // Don't shrink too much
      config.lineHeight.bullet = Math.max(1.2, config.lineHeight.bullet * scaleFactor);
    }
    
    // If we're under (for 2-page mode), increase spacing
    if (currentHeight < targetHeight - tolerance && this.targetPages === 2) {
      const scaleFactor = (targetHeight - tolerance) / currentHeight;
      
      config.margin.h2.top *= scaleFactor;
      config.margin.h2.bottom *= scaleFactor;
      config.margin.bullet.top *= scaleFactor;
      config.margin.bullet.bottom *= scaleFactor;
      config.lineHeight.bullet = Math.min(1.6, config.lineHeight.bullet * scaleFactor);
    }

    // Round values to 2 decimal places
    Object.keys(config.fontSize).forEach(key => {
      config.fontSize[key as keyof typeof config.fontSize] = 
        Math.round(config.fontSize[key as keyof typeof config.fontSize] * 100) / 100;
    });

    return config;
  }

  generateCSS(config: SpacingConfig): string {
    return `
.resume {
  padding: ${config.margin.topPadding}px ${config.margin.topPadding * 1.2}px;
}

.name {
  font-size: ${config.fontSize.name}px;
}

.tagline {
  font-size: ${config.fontSize.tagline}px;
  line-height: ${config.lineHeight.tagline};
  margin-top: 4px;
}

.top {
  padding-bottom: ${config.margin.topSection.bottom}px;
  margin-bottom: ${config.margin.topSection.bottom}px;
}

h2 {
  font-size: ${config.fontSize.h2}px;
  margin: ${config.margin.h2.top}px 0 ${config.margin.h2.bottom}px;
}

li {
  font-size: ${config.fontSize.bullet}px;
  line-height: ${config.lineHeight.bullet};
  margin: ${config.margin.bullet.top}px 0;
}

.role {
  margin-bottom: ${config.margin.role.bottom}px;
}

.chip {
  font-size: ${config.fontSize.chip}px;
  padding: ${config.padding.chip.vertical}px ${config.padding.chip.horizontal}px;
}

.small {
  font-size: ${config.fontSize.small}px;
}

aside h2:not(:first-of-type) {
  margin-top: ${config.margin.aside.h2}px;
}

.foot {
  margin-top: ${config.margin.footer.top}px;
  padding-top: ${config.margin.footer.topPadding}px;
}

@media print {
  .resume {
    padding: ${config.margin.topPadding / 96 * 2.54}cm ${(config.margin.topPadding * 1.2) / 96 * 2.54}cm;
  }
}
    `.trim();
  }

  analyze(resumeId: string): { 
    elements: ResumeElements; 
    optimalConfig: SpacingConfig; 
    estimatedHeight: number;
    targetHeight: number;
    css: string;
    actualHeaderHeight: number;
    actualTotalHeight: number;
    scaleFactor: number;
  } | null {
    const elements = this.countElements(resumeId);
    if (!elements) return null;

    const measurements = this.measureInPrintMode(resumeId);
    const optimalConfig = this.optimizeSpacing(elements, measurements);
    const estimatedHeight = this.calculateTotalHeight(elements, optimalConfig, measurements);
    const targetHeight = this.targetPages * this.pageHeight;
    const scaleFactor = measurements.totalHeight > 0 ? targetHeight / measurements.totalHeight : 1;

    return {
      elements,
      optimalConfig,
      estimatedHeight,
      targetHeight,
      css: this.generateCSS(optimalConfig),
      actualHeaderHeight: measurements.headerHeight,
      actualTotalHeight: measurements.totalHeight,
      scaleFactor,
    };
  }
}
