export async function importTextFromFile(file, runOcrBackend, setText) {
  const name = file.name.toLowerCase();

  try {
    // TXT
    if (name.endsWith(".txt")) {
      setText(await file.text());
      return;
    }

    // PDF
    if (name.endsWith(".pdf")) {
      const pdfjs = await import("pdfjs-dist/build/pdf");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

      const buf = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;
      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((c) => c.str).join(" ") + "\n";
      }

      setText(text);
      return;
    }

    // DOC / DOCX
    if (name.endsWith(".doc") || name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const buf = await file.arrayBuffer();
      const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
      setText(value);
      return;
    }

    // IMAGES → OCR
    if ([".jpg", ".jpeg", ".png", ".bmp"].some((ext) => name.endsWith(ext))) {
      const reader = new FileReader();
      reader.onload = async () => {
        const resultText = await runOcrBackend(reader.result);
        setText(resultText || "");
      };
      reader.readAsDataURL(file);
      return;
    }
  } catch (err) {
    console.error("Upload error:", err);
    alert("Failed to import text.");
  }
}
