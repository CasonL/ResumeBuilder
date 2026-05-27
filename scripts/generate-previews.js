const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const RESUMES = [
  { id: 'innovates', filename: 'innovates.png' },
  { id: 'td-bank', filename: 'td-bank.png' },
];

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../public/previews');

async function generatePreviews() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🚀 Starting preview generation...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const resume of RESUMES) {
      console.log(`📄 Generating preview for: ${resume.id}`);
      
      const page = await browser.newPage();
      
      await page.setViewport({
        width: 1200,
        height: 1200,
        deviceScaleFactor: 2,
      });

      await page.goto(`${BASE_URL}/resume/${resume.id}`, {
        waitUntil: 'networkidle0',
      });

      await page.evaluate(() => {
        const header = document.querySelector('.viewer-header');
        if (header) header.style.display = 'none';
      });

      const outputPath = path.join(OUTPUT_DIR, resume.filename);
      
      await page.screenshot({
        path: outputPath,
        type: 'png',
        fullPage: false,
      });
      
      console.log(`✅ Saved: ${resume.filename}\n`);

      await page.close();
    }

    console.log('✨ Preview generation complete!');
  } catch (error) {
    console.error('Error generating previews:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

generatePreviews().catch((error) => {
  console.error('Failed to generate previews:', error);
  process.exit(1);
});
