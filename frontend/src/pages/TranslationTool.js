// src/pages/TranslationTool.js
import React, { useState, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Webcam from "react-webcam";
import "../pdf-worker";

const BASE = "http://localhost:5000";

export default function TranslationTool() {
  const [text, setText] = useState("");
  const [translated, setTranslated] = useState("");
  const [lang, setLang] = useState("Hindi");
  const [loading, setLoading] = useState(false);

  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  // compress images quickly
  async function compress(dataUrl, maxWidth = 1000, quality = 0.7) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = img.width * scale;
        const h = img.height * scale;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = dataUrl;
    });
  }

  // OCR backend call
  async function runOcrBackend(dataUrl) {
    try {
      const res = await fetch(`${BASE}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json();
      return json.text || "";
    } catch {
      alert("OCR failed");
      return "";
    }
  }

  // File upload handler
  async function handleFile(e) {
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
        let t = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          t += content.items.map((x) => x.str).join(" ") + "\n";
        }
        setText(t);
        return;
      }

      if (name.endsWith(".doc") || name.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const buf = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
        setText(value);
        return;
      }

      // IMAGE
      if ([".jpg", ".jpeg", ".png", ".bmp"].some((ext) => name.endsWith(ext))) {
        const reader = new FileReader();
        reader.onload = async () => {
          const compressed = await compress(reader.result);
          const extracted = await runOcrBackend(compressed);
          setText(extracted || "");
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
      alert("File failed");
    } finally {
      e.target.value = "";
    }
  }

  // Camera capture
  async function captureImage() {
    const url = webcamRef.current?.getScreenshot();
    if (!url) return;

    const compressed = await compress(url);
    const extracted = await runOcrBackend(compressed);
    setText(extracted);

    setShowCamera(false);
  }

  // Translate
  async function translate() {
    if (!text.trim()) return alert("Enter text first");

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: lang }),
      });

      const json = await res.json();
      setTranslated(json.translated || "");
    } catch {
      alert("Translation failed");
    }
    setLoading(false);
  }

  return (
    <div className="app-bg min-h-screen p-6 flex justify-center items-center">
      <div className="glass-card max-w-5xl w-full p-6">

        {/* header */}
        <div className="flex justify-between mb-4">
          <Link to="/" className="flex items-center gap-2 text-gray-600">
            <ArrowLeft size={16} /> Back
          </Link>
          <h2 className="font-bold text-xl">Translation Tool</h2>
        </div>

        {/* camera modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
            <div className="bg-white p-4 rounded-lg shadow w-[350px]">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/png"
                videoConstraints={{ facingMode: "environment" }}
                className="rounded mb-3"
              />
              <button onClick={captureImage} className="w-full bg-green-600 p-2 rounded text-white mb-2">Capture</button>
              <button onClick={() => setShowCamera(false)} className="w-full bg-red-600 p-2 rounded text-white">Close</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Input */}
          <div>
            <label>Enter or Upload Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="w-full p-3 mt-2 rounded border"
            />

            <input
              type="file"
              className="w-full mt-2"
              accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.bmp"
              onChange={handleFile}
            />

            <button
              onClick={() => setShowCamera(true)}
              className="w-full p-2 bg-blue-600 text-white rounded mt-2"
            >
              📷 Open Camera
            </button>
          </div>

          {/* Output */}
          <div>
            <label>Output Translation</label>

            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full p-2 border rounded mt-2"
            >
              {["Hindi", "Kannada", "Tamil", "Telugu", "Malayalam", "French", "Spanish"]
                .map((l) => (
                  <option key={l}>{l}</option>
                ))}
            </select>

            <button
              onClick={translate}
              disabled={loading}
              className="w-full bg-indigo-600 text-white p-2 rounded mt-3"
            >
              {loading ? "Translating…" : "Translate"}
            </button>

            <div className="border bg-white/70 p-3 rounded mt-4 min-h-[120px] whitespace-pre-wrap">
              {translated || "No translation yet."}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
