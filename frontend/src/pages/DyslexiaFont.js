// src/pages/DyslexiaFont.js
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Webcam from "react-webcam";

// PDF worker
import "../pdf-worker";

export default function DyslexiaFont() {
  // -----------------------------
  // UI / Editor State
  // -----------------------------
  const [text, setText] = useState("Type or paste text here...");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");

  // -----------------------------
  // Camera + OCR
  // -----------------------------
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);

  // Tesseract worker stored so it loads ONCE
  const tesseractWorkerRef = useRef(null);

  // -----------------------------
  // Fonts
  // -----------------------------
  const availableFonts = [
    "Arial",
    "Verdana",
    "Helvetica",
    "Georgia",
    "Times New Roman",
    "OpenDyslexic",
    "Comic Sans MS",
    "Calibri",
    "Trebuchet MS",
    "Tahoma",
    "Courier New",
    "Inter",
    "Roboto",
    "Poppins",
    "Lato",
    "Ubuntu",
  ];

  function computeFontFamilyCSS(name) {
    if (name === "OpenDyslexic")
      return "OpenDyslexic, Arial, sans-serif";
    return name;
  }

  // -----------------------------
  // Summarization State
  // -----------------------------
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);

  // -----------------------------
  // TTS State
  // -----------------------------
  const [rate, setRate] = useState(1.0);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  // -----------------------------
  // IMAGE PREPROCESSING
  // -----------------------------
  async function preprocessForOcr(dataUrl) {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });

    const w = 1600;
    const scale = w / img.width;
    const h = img.height * scale;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    // grayscale + sharpen
    let id = ctx.getImageData(0, 0, w, h);
    let d = id.data;

    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = g;
    }

    ctx.putImageData(id, 0, 0);
    return canvas;
  }

  // -----------------------------
  // OCR FUNCTION – FIXED + CLEAN
  // -----------------------------
  async function runOcr(inputDataUrl) {
    setOcrBusy(true);
    try {
      const T = await import("tesseract.js");

      if (!tesseractWorkerRef.current) {
        tesseractWorkerRef.current = await T.createWorker(); // NO LOGGER
        await tesseractWorkerRef.current.load();
        await tesseractWorkerRef.current.loadLanguage("eng");
        await tesseractWorkerRef.current.initialize("eng");
      }

      const worker = tesseractWorkerRef.current;

      const processedCanvas = await preprocessForOcr(inputDataUrl);

      const {
        data: { text },
      } = await worker.recognize(processedCanvas);

      return text || "";
    } catch (err) {
      console.error("OCR error:", err);
      return "";
    } finally {
      setOcrBusy(false);
    }
  }

  // -----------------------------
  // File Upload
  // -----------------------------
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
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

        const buff = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buff }).promise;
        let finalText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          finalText += content.items.map((c) => c.str).join(" ") + "\n";
        }

        setText(finalText);
        return;
      }

      // DOC/DOCX
      if (name.endsWith(".doc") || name.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const buf = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
        setText(value);
        return;
      }

      // IMAGE → OCR
      if ([".jpg", ".jpeg", ".png", ".bmp"].some((ext) => name.endsWith(ext))) {
        const reader = new FileReader();
        reader.onload = async () => {
          setText("Extracting text...");
          const result = await runOcr(reader.result);
          setText(result || "");
        };
        reader.readAsDataURL(file);
        return;
      }
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      e.target.value = "";
    }
  }

  // -----------------------------
  // CAMERA CAPTURE
  // -----------------------------
  async function captureImage() {
    const dataUrl = webcamRef.current?.getScreenshot();
    if (!dataUrl) return;

    setText("Extracting text...");
    const result = await runOcr(dataUrl);
    setText(result || "");
    setShowCamera(false);
  }

  // -----------------------------
  // TTS CONTROLS
  // -----------------------------
  function stopAllTTS() {
    window.speechSynthesis.cancel();
    setIsHighlighting(false);
    setCurrentWordIndex(-1);
  }

  function readOnly() {
    stopAllTTS();
    if (!text.trim()) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    window.speechSynthesis.speak(u);
  }

  function readWithHighlights() {
    stopAllTTS();

    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;

    u.onboundary = (e) => {
      const idx = text.slice(0, e.charIndex).trim().split(/\s+/).length - 1;
      setCurrentWordIndex(idx);
    };

    u.onstart = () => {
      setIsHighlighting(true);
      setCurrentWordIndex(-1);
    };

    u.onend = () => {
      setIsHighlighting(false);
      setCurrentWordIndex(-1);
    };

    window.speechSynthesis.speak(u);
  }

  // -----------------------------
  // Highlight Rendering
  // -----------------------------
  function HighlightView() {
    const tokens = text.split(/\s+/);

    return (
      <div
        style={{
          fontSize: `${fontSize}px`,
          lineHeight,
          letterSpacing: `${letterSpacing}px`,
          background: bgColor,
          color: textColor,
          fontFamily: computeFontFamilyCSS(fontFamily),
          padding: 16,
          borderRadius: 8,
        }}
      >
        {tokens.map((t, i) => (
          <span
            key={i}
            style={{
              backgroundColor: i === currentWordIndex ? "yellow" : "transparent",
              padding: "2px 4px",
              borderRadius: 4,
            }}
          >
            {t}{" "}
          </span>
        ))}
      </div>
    );
  }

  // -----------------------------
  // Summarization
  // -----------------------------
  async function summarizeText() {
    setSummarizing(true);
    try {
      const res = await fetch("http://localhost:5000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setSummary(data.summary || "");
    } catch {
      alert("Backend not running");
    }
    setSummarizing(false);
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-6">
      <div className="glass-card p-6 max-w-6xl w-full">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <Link to="/" className="flex items-center gap-2 text-gray-600">
            <ArrowLeft size={16} /> Back
          </Link>
          <h2 className="font-bold text-xl">Dyslexia-Friendly Reader</h2>
        </div>

        {/* CAMERA MODAL */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow w-[350px]">
              <h3 className="font-semibold mb-2">Capture Image</h3>

              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/png"
                videoConstraints={{ facingMode: "environment" }}
                className="rounded mb-3"
              />

              <button
                onClick={captureImage}
                className="w-full bg-green-600 text-white p-2 rounded mb-2"
              >
                Capture
              </button>

              <button
                onClick={() => setShowCamera(false)}
                className="w-full bg-red-600 text-white p-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* LEFT PANEL */}
          <div className="space-y-4">

            {/* FONT */}
            <div className="p-3 bg-white/70 rounded">
              <label>Font</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-2 border rounded mt-2"
              >
                {availableFonts.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* SPACING */}
            <div className="p-3 bg-white/70 rounded">
              <label>Font Size: {fontSize}px</label>
              <input
                type="range"
                min="14"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />

              <label className="block mt-3">Line Height: {lineHeight}</label>
              <input
                type="range"
                min="1"
                max="2.4"
                step="0.1"
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="w-full"
              />

              <label className="block mt-3">
                Letter Spacing: {letterSpacing}px
              </label>
              <input
                type="range"
                min="0"
                max="4"
                step="0.1"
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* COLORS */}
            <div className="p-3 bg-white/70 rounded">
              <label>Background Color</label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full h-10 mt-2 rounded"
              />
            </div>

            <div className="p-3 bg-white/70 rounded">
              <label>Text Color</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-10 mt-2 rounded"
              />
            </div>

            {/* FILE UPLOAD */}
            <div className="p-3 bg-white/70 rounded">
              <label>Upload File</label>
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.bmp"
                onChange={handleFileUpload}
                className="w-full border p-2 rounded mt-2"
              />

              <button
                onClick={() => setShowCamera(true)}
                className="w-full bg-blue-600 text-white p-2 rounded mt-2"
              >
                📷 Open Camera
              </button>

              {ocrBusy && (
                <p className="text-sm text-orange-600 mt-1">
                  OCR running… please wait
                </p>
              )}
            </div>

            {/* TTS */}
            <div className="p-3 bg-white/70 rounded">
              <label>Reading Speed: {rate}x</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full"
              />

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={stopAllTTS}
                  className="px-3 py-2 bg-red-600 text-white rounded"
                >
                  ⏹
                </button>

                <button
                  onClick={readOnly}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded"
                >
                  ▶ Read
                </button>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={stopAllTTS}
                  className="px-3 py-2 bg-red-600 text-white rounded"
                >
                  ⏹
                </button>

                <button
                  onClick={readWithHighlights}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded"
                >
                  ✨ Read With Highlights
                </button>
              </div>

              <button
                onClick={summarizeText}
                disabled={summarizing}
                className="w-full bg-indigo-600 text-white p-2 rounded mt-3"
              >
                {summarizing ? "Summarizing…" : "Summarize"}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="col-span-3">
            <label className="font-semibold">Editor</label>

            {!isHighlighting ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight,
                  letterSpacing: `${letterSpacing}px`,
                  background: bgColor,
                  color: textColor,
                  fontFamily: computeFontFamilyCSS(fontFamily),
                }}
                className="w-full p-4 mt-2 rounded resize-vertical"
              />
            ) : (
              <HighlightView />
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigator.clipboard.writeText(text)}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Copy
              </button>
              <button
                onClick={() => setText("")}
                className="px-4 py-2 border rounded"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 p-4 bg-white/70 rounded border">
              <label className="font-semibold">Summary</label>
              <div className="mt-2 whitespace-pre-wrap min-h-[60px]">
                {summary || "No summary yet."}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
