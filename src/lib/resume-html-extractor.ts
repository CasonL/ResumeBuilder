export function extractResumeHtml(elementId: string): string {
  if (typeof window === 'undefined') return '';
  
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const styles = Array.from(document.styleSheets)
    .filter(sheet => {
      try {
        return sheet.cssRules;
      } catch {
        return false;
      }
    })
    .map(sheet => {
      try {
        return Array.from(sheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${styles}
  </style>
</head>
<body>
  ${element.outerHTML}
</body>
</html>
  `.trim();

  return fullHtml;
}

export function createResumeHtmlFromContent(content: string, styles: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${styles}
    @page {
      size: letter;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
  `.trim();
}
