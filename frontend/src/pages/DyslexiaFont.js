// frontend/src/pages/DyslexiaFont.js
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Webcam from "react-webcam";
import "../pdf-worker";

const BASE = "http://localhost:5000";

export default function DyslexiaFont() {
  const [text, setText] = useState("Type or paste text here...");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");

  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);

  const availableFonts = [
    "Arial","Verdana","Helvetica","Georgia","Times New Roman","OpenDyslexic",
    "Comic Sans MS","Calibri","Trebuchet MS","Tahoma","Courier New","Inter",
    "Roboto","Poppins","Lato","Ubuntu"
  ];

  function computeFontFamilyCSS(name) {
    return name === "OpenDyslexic" ? "OpenDyslexic, Arial, sans-serif" : name;
  }

  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);

  const [rate, setRate] = useState(1.0);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  // handle paste from clipboard (images)
  useEffect(() => {
    const onPaste = async (e) => {
      // look for image in clipboard items
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items || []);
      const imageItem = items.find((i) => i.type.startsWith("image/"));
      if (imageItem) {
        try {
          const blob = imageItem.getAsFile();
          if (!blob) return;
          const reader = new FileReader();
          reader.onload = async () => {
            setText("Compressing pasted image...");
            const compressed = await compressDataUrl(reader.result);
            setText("Extracting text from pasted image...");
            const extracted = await runOcrBackend(compressed);
            setText(extracted || "");
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          console.error("Paste OCR error:", err);
        }
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // compress images client-side
  async function compressDataUrl(dataUrl, maxWidth = 1000, quality = 0.7) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  // send to backend OCR
  async function runOcrBackend(dataUrl) {
    try {
      setOcrBusy(true);
      console.log("Sending OCR request to", new URL("/ocr", BASE).href);
      const res = await fetch(new URL("/ocr", BASE).href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      // if backend responded with HTML (bad URL), this will throw
      const json = await res.json();
      if (json.error) {
        console.error("OCR backend returned error:", json);
        return "";
      }
      return json.text || "";
    } catch (err) {
      console.error("OCR Backend Error:", err);
      alert("OCR failed — check backend is running and /ocr URL is reachable. See console.");
      return "";
    } finally {
      setOcrBusy(false);
    }
  }

  // file upload handler
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();

    try {
      if (name.endsWith(".txt")) {
        setText(await file.text());
        return;
      }

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

      if (name.endsWith(".doc") || name.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const buf = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
        setText(value);
        return;
      }

      if ([".jpg", ".jpeg", ".png", ".bmp"].some((ext) => name.endsWith(ext))) {
        const reader = new FileReader();
        reader.onload = async () => {
          setText("Compressing image...");
          const compressed = await compressDataUrl(reader.result);
          setText("Extracting text...");
          const extracted = await runOcrBackend(compressed);
          setText(extracted || "");
        };
        reader.readAsDataURL(file);
        return;
      }

      // fallback: try to read as text
      setText(await file.text());
    } catch (err) {
      console.error("File upload error:", err);
      alert("File processing failed. See console.");
    } finally {
      e.target.value = "";
    }
  }

  async function captureImage() {
    const dataUrl = webcamRef.current?.getScreenshot();
    if (!dataUrl) return;
    setText("Compressing image...");
    const compressed = await compressDataUrl(dataUrl);
    setText("Extracting text...");
    const extracted = await runOcrBackend(compressed);
    setText(extracted || "");
    setShowCamera(false);
  }

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
    u.onstart = () => setIsHighlighting(true);
    u.onend = () => {
      setIsHighlighting(false);
      setCurrentWordIndex(-1);
    };
    window.speechSynthesis.speak(u);
  }

  function HighlightView() {
    const tokens = text.split(/\s+/);
    return (
      <div style={{
        fontSize: `${fontSize}px`,
        lineHeight,
        letterSpacing: `${letterSpacing}px`,
        background: bgColor,
        color: textColor,
        fontFamily: computeFontFamilyCSS(fontFamily),
        padding: 16,
        borderRadius: 8,
      }}>
        {tokens.map((t, i) => (
          <span key={i} style={{
            backgroundColor: i === currentWordIndex ? "yellow" : "transparent",
            padding: "2px 4px",
            borderRadius: 4,
          }}>{t}{" "}</span>
        ))}
      </div>
    );
  }

  async function summarizeText() {
    setSummarizing(true);
    try {
      const res = await fetch(new URL("/summarize", BASE).href, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (json.error) {
        console.error("Summarizer error:", json);
        alert("Summarizer error (see console)");
      } else {
        setSummary(json.summary || "");
      }
    } catch (err) {
      console.error("Summarizer request failed:", err);
      alert("Summarizer request failed (see console)");
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-6">
      <div className="glass-card p-6 max-w-6xl w-full">
        <div className="flex justify-between items-center mb-4">
          <Link to="/" className="flex items-center gap-2 text-gray-600">
            <ArrowLeft size={16} /> Back
          </Link>
          <h2 className="font-bold text-xl">Dyslexia-Friendly Reader</h2>
        </div>

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
              <button onClick={captureImage} className="w-full bg-green-600 text-white p-2 rounded mb-2">Capture</button>
              <button onClick={() => setShowCamera(false)} className="w-full bg-red-600 text-white p-2 rounded">Close</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <div className="p-3 bg-white/70 rounded">
              <label>Font</label>
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full p-2 border rounded mt-2">
                {availableFonts.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            <div className="p-3 bg-white/70 rounded">
              <label>Font Size: {fontSize}px</label>
              <input type="range" min="14" max="48" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full" />
              <label className="block mt-3">Line Height: {lineHeight}</label>
              <input type="range" min="1" max="2.4" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} className="w-full" />
              <label className="block mt-3">Letter Spacing: {letterSpacing}px</label>
              <input type="range" min="0" max="4" step="0.1" value={letterSpacing} onChange={(e) => setLetterSpacing(Number(e.target.value))} className="w-full" />
            </div>

            <div className="p-3 bg-white/70 rounded flex items-center gap-3">
              <div style={{flex:1}}>
                <label>Background Color</label>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-10 mt-2 rounded" />
              </div>
              <div style={{width:48, height:34, borderRadius:6, border:"1px solid #ddd", background:bgColor}} aria-hidden />
            </div>

            <div className="p-3 bg-white/70 rounded flex items-center gap-3">
              <div style={{flex:1}}>
                <label>Text Color</label>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-10 mt-2 rounded" />
              </div>
              <div style={{width:48, height:34, borderRadius:6, border:"1px solid #ddd", background:textColor}} aria-hidden />
            </div>

            <div className="p-3 bg-white/70 rounded">
              <label>Upload File</label>
              <input type="file" accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.bmp" onChange={handleFileUpload} className="w-full border p-2 rounded mt-2" />
              <button onClick={() => setShowCamera(true)} className="w-full bg-blue-600 text-white p-2 rounded mt-2">📷 Open Camera</button>
              {ocrBusy && <p className="text-sm text-orange-600 mt-1">OCR running… please wait</p>}
            </div>

            <div className="p-3 bg-white/70 rounded">
              <label>Reading Speed: {rate}x</label>
              <input type="range" min="0.5" max="2" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full" />

              <div className="flex items-center gap-2 mt-3">
                <button onClick={stopAllTTS} className="px-3 py-2 bg-red-600 text-white rounded">⏹</button>
                <button onClick={readOnly} className="flex-1 px-4 py-2 bg-green-600 text-white rounded">▶ Read</button>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button onClick={stopAllTTS} className="px-3 py-2 bg-red-600 text-white rounded">⏹</button>
                <button onClick={readWithHighlights} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded">Read with Highlights</button>
              </div>

              <button onClick={summarizeText} disabled={summarizing} className="w-full bg-indigo-600 text-white p-2 rounded mt-3">{summarizing ? "Summarizing…" : "Summarize"}</button>
            </div>
          </div>

          <div className="col-span-3">
            <label className="font-semibold">Editor</label>

            {!isHighlighting ? (
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} style={{
                fontSize: `${fontSize}px`,
                lineHeight,
                letterSpacing: `${letterSpacing}px`,
                background: bgColor,
                color: textColor,
                fontFamily: computeFontFamilyCSS(fontFamily),
              }} className="w-full p-4 mt-2 rounded resize-vertical" />
            ) : <HighlightView />}

            <div className="flex gap-2 mt-3">
              <button onClick={() => navigator.clipboard.writeText(text)} className="px-4 py-2 bg-indigo-600 text-white rounded">Copy</button>
              <button onClick={() => setText("")} className="px-4 py-2 border rounded">Clear</button>
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
