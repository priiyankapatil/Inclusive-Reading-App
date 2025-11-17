// src/pages/TextToSpeech.js
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Webcam from "react-webcam";
import "../pdf-worker";

const BASE = "http://localhost:5000";

export default function TextToSpeech() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy"); // sent to backend (if supported)
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // playback controls
  const [playRate, setPlayRate] = useState(1.0);
  const audioRef = useRef(null);

  // camera / OCR
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);

  // highlighting TTS
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  // simple compress function (client-side) to avoid large payloads
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

  // OCR backend call
  async function runOcrBackend(dataUrl) {
    try {
      setOcrBusy(true);
      const res = await fetch(`${BASE}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const json = await res.json();
      if (json.error) {
        console.error("OCR error:", json);
        return "";
      }
      return json.text || "";
    } catch (err) {
      console.error("OCR request failed:", err);
      alert("OCR failed — check backend console");
      return "";
    } finally {
      setOcrBusy(false);
    }
  }

  // file upload handler (txt/pdf/doc/docx/images)
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

      // DOC / DOCX
      if (name.endsWith(".doc") || name.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const buf = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
        setText(value);
        return;
      }

      // IMAGES -> OCR
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

      // fallback: try as text
      setText(await file.text());
    } catch (err) {
      console.error("File upload error:", err);
      alert("File processing failed — check console");
    } finally {
      e.target.value = "";
    }
  }

  // camera capture -> OCR
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

  // request backend TTS -> returns base64 audio
  async function generateTTS() {
    if (!text || !text.trim()) return alert("Please provide text first.");
    setLoading(true);
    setAudioUrl("");
    try {
      const res = await fetch(`${BASE}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      });

      const json = await res.json();
      if (json.error) {
        console.error("TTS error:", json);
        alert("TTS failed (see console)");
        setLoading(false);
        return;
      }

      if (json.audio) {
        const byteChars = atob(json.audio);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "audio/mp3" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // auto-play a bit after load
        setTimeout(() => {
          try {
            if (audioRef.current) {
              audioRef.current.playbackRate = playRate;
              audioRef.current.play().catch(() => {});
            }
          } catch {}
        }, 200);
      } else {
        alert("No audio returned from backend");
      }
    } catch (err) {
      console.error("TTS request failed:", err);
      alert("TTS request failed — see console");
    } finally {
      setLoading(false);
    }
  }

  // browser TTS with highlights
  function readWithHighlights() {
    stopHighlighting();
    if (!text.trim()) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = playRate;

    utter.onboundary = (e) => {
      // compute token index (words)
      const idx = text.slice(0, e.charIndex).trim().split(/\s+/).length - 1;
      setCurrentIndex(idx);
    };

    utter.onstart = () => {
      setIsHighlighting(true);
      setCurrentIndex(-1);
    };

    utter.onend = () => {
      setIsHighlighting(false);
      setCurrentIndex(-1);
    };

    window.speechSynthesis.speak(utter);
  }

  function stopHighlighting() {
    window.speechSynthesis.cancel();
    setIsHighlighting(false);
    setCurrentIndex(-1);
  }

  // copy audio blob to file download
  function downloadAudio() {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "speech.mp3";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // helper: Highlight view
  function HighlightView() {
    const tokens = text.split(/\s+/);
    return (
      <div style={{
        fontSize: 16,
        lineHeight: 1.6,
        background: "#fff",
        padding: 12,
        borderRadius: 8,
        color: "#111",
      }}>
        {tokens.map((t, i) => (
          <span key={i} style={{
            backgroundColor: i === currentIndex ? "yellow" : "transparent",
            padding: "2px 4px",
            borderRadius: 3,
            marginRight: 2,
            display: "inline-block"
          }}>
            {t}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-6">
      <div className="glass-card p-6 max-w-4xl w-full">

        {/* header */}
        <div className="flex justify-between items-center mb-4">
          <Link to="/" className="flex items-center gap-2 text-gray-600">
            <ArrowLeft size={16} /> Back
          </Link>
          <h2 className="font-bold text-xl">Text to Speech</h2>
        </div>

        {/* camera modal */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* left: input */}
          <div className="col-span-2">
            {!isHighlighting ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={12}
                className="w-full p-4 mt-2 rounded resize-vertical"
                placeholder="Type or paste text here..."
              />
            ) : (
              <HighlightView />
            )}

            <div className="flex gap-2 mt-3">
              <input type="file" accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.bmp" onChange={handleFileUpload} className="flex-1" />
              <button onClick={() => setShowCamera(true)} className="px-4 py-2 bg-blue-600 text-white rounded">📷 Camera</button>
            </div>

            {ocrBusy && <p className="text-sm text-orange-600 mt-1">OCR running… please wait</p>}
          </div>

          {/* right: controls */}
          <div>
            <label className="font-semibold">Voice (backend)</label>
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className="w-full p-2 border rounded mt-2">
              <option value="alloy">Alloy</option>
              <option value="nova">Nova</option>
              <option value="verse">Verse</option>
            </select>

            <label className="font-semibold block mt-4">Playback Speed: {playRate.toFixed(1)}x</label>
            <input type="range" min="0.5" max="2" step="0.1" value={playRate} onChange={(e) => setPlayRate(Number(e.target.value))} className="w-full mt-2" />

            <div className="flex gap-2 mt-4">
              <button onClick={generateTTS} disabled={loading} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded">{loading ? "Generating…" : "Generate Audio"}</button>
              <button onClick={readWithHighlights} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded">Read with Highlights</button>
            </div>

            <div className="flex gap-2 mt-3">
              <button onClick={() => { if (audioRef.current) audioRef.current.play() }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded">Play</button>
              <button onClick={() => { if (audioRef.current) audioRef.current.pause() }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded">Pause</button>
            </div>

            <button onClick={downloadAudio} className="w-full mt-3 bg-indigo-600 text-white p-2 rounded" disabled={!audioUrl}>Download MP3</button>

            <div className="mt-4">
              <label className="font-semibold">Generated Audio</label>
              <div className="mt-2">
                {audioUrl ? (
                  <audio ref={audioRef} controls src={audioUrl} style={{ width: "100%" }} onPlay={() => { if (audioRef.current) audioRef.current.playbackRate = playRate; }} />
                ) : (
                  <div className="p-3 border rounded bg-gray-50">No audio yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
