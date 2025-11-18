import { useCallback } from "react";
import { useOCR } from "./useOCR";

export function useFileUpload() {
  const { processImage } = useOCR();

  const processFile = useCallback(async (file) => {
    if (!file) return null;
    const name = file.name.toLowerCase();

    try {
      // TXT files
      if (name.endsWith(".txt")) {
        return await file.text();
      }

      // PDF files
      if (name.endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist/build/pdf");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        const buff = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buff }).promise;
        let finalText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          finalText += content.items.map((c) => c.str).join(" ") + "\n";
        }
        return finalText;
      }

      // DOC/DOCX files
      if (name.endsWith(".doc") || name.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const buf = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
        return value;
      }

      // Image files -> OCR
      if ([".jpg", ".jpeg", ".png", ".bmp"].some((ext) => name.endsWith(ext))) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const text = await processImage(reader.result);
            resolve(text || "");
          };
          reader.readAsDataURL(file);
        });
      }

      // Fallback: try to read as text
      return await file.text();
    } catch (err) {
      console.error("File processing error:", err);
      alert("File processing failed. See console.");
      return null;
    }
  }, [processImage]);

  return { processFile };
}
