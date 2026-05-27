import * as pdfjsLib from "pdfjs-dist";

export async function extractPdfText(file: File): Promise<string> {
  // Worker setup for Next (browser)
  // This is the key: pdf.js needs a worker in browser builds.
  // Next can handle this URL pattern.
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map((it: any) => (typeof it.str === "string" ? it.str : ""))
      .filter(Boolean);
    fullText += strings.join(" ") + "\n";
  }

  return fullText.trim();
}
