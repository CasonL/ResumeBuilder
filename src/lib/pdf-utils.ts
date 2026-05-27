import puppeteer from 'puppeteer';

export interface PDFMeasurement {
  pageCount: number;
  contentHeight: number;
  pageHeight: number;
  overflow: boolean;
  overflowAmount?: number;
}

export async function measureResumePDF(htmlContent: string): Promise<PDFMeasurement> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    await page.addStyleTag({
      content: `
        @page {
          size: letter;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
        }
      `,
    });

    const pdf = await page.pdf({
      format: 'letter',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true, // Preserve text as selectable text
    });

    const contentHeight = await page.evaluate(() => {
      const body = document.body;
      return Math.max(
        body.scrollHeight,
        body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
    });

    const pageHeight = 11 * 96;
    const pageCount = Math.ceil(contentHeight / pageHeight);
    const overflow = contentHeight > pageHeight && (contentHeight % pageHeight) < pageHeight * 0.95;
    const overflowAmount = overflow ? contentHeight - (Math.floor(contentHeight / pageHeight) * pageHeight) : 0;

    await browser.close();

    return {
      pageCount,
      contentHeight,
      pageHeight,
      overflow,
      overflowAmount,
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function renderResumeToPDF(htmlContent: string): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    const pdf = await page.pdf({
      format: 'letter',
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true, // Preserve text as selectable text, not images
      displayHeaderFooter: false,
      margin: {
        top: '0.4in',
        right: '0.5in',
        bottom: '0.4in',
        left: '0.5in',
      },
    });

    await browser.close();
    return pdf;
  } catch (error) {
    await browser.close();
    throw error;
  }
}
