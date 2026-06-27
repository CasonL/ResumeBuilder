import * as pdfjsLib from "pdfjs-dist";

export async function extractPdfText(file: File): Promise<string> {
  // Serve the worker from public/ so Next.js doesn't bundle it.
  // The file is copied to public/pdf.worker.min.mjs at build/setup time.
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

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
