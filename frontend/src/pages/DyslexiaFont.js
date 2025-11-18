// frontend/src/pages/DyslexiaFont.js
import React, { useState, useRef, useEffect } from "react";
import PageHeader from "../components/common/PageHeader";
import CameraCapture from "../components/common/CameraCapture";
import ColorPicker from "../components/common/ColorPicker";
import TypographyControls from "../components/dyslexia/TypographyControls";
import TextEditor from "../components/dyslexia/TextEditor";
import InputControls from "../components/dyslexia/InputControls";
import TTSControls from "../components/dyslexia/TTSControls";
import SummaryDisplay from "../components/dyslexia/SummaryDisplay";
import { useOCR } from "../hooks/useOCR";
import { useFileUpload } from "../hooks/useFileUpload";
import { useTTS } from "../hooks/useTTS";
import "../pdf-worker";

const BASE = "http://localhost:6969";

export default function DyslexiaFont() {
  // Text state
  const [text, setText] = useState("Type or paste text here...");
  
  // Typography state
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [letterSpacing, setLetterSpacing] = useState(0);
  
  // Color state
  const [bgColor, setBgColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  
  // Camera state
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  
  // Summary state
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  
  // TTS state
  const [rate, setRate] = useState(1.0);
  
  // Custom hooks
  const { isProcessing: ocrBusy, processImage } = useOCR();
  const { processFile } = useFileUpload();
  const { isReading: isHighlighting, currentWordIndex, speak, speakWithHighlight, stop } = useTTS();

  // Handle paste from clipboard (images)
  useEffect(() => {
    const onPaste = async (e) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items || []);
      const imageItem = items.find((i) => i.type.startsWith("image/"));
      if (imageItem) {
        try {
          const blob = imageItem.getAsFile();
          if (!blob) return;
          const reader = new FileReader();
          reader.onload = async () => {
            setText("Processing pasted image...");
            const extracted = await processImage(reader.result);
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
  }, [processImage]);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const result = await processFile(file);
    if (result) {
      setText(result);
    }
    e.target.value = "";
  }

  async function captureImage() {
    const dataUrl = webcamRef.current?.getScreenshot();
    if (!dataUrl) return;
    setText("Processing image...");
    const extracted = await processImage(dataUrl);
    setText(extracted || "");
    setShowCamera(false);
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
        <PageHeader title="Dyslexia-Friendly Reader" />

        <CameraCapture
          webcamRef={webcamRef}
          onCapture={captureImage}
          onClose={() => setShowCamera(false)}
          isOpen={showCamera}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="space-y-4">
            <TypographyControls
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              fontSize={fontSize}
              setFontSize={setFontSize}
              lineHeight={lineHeight}
              setLineHeight={setLineHeight}
              letterSpacing={letterSpacing}
              setLetterSpacing={setLetterSpacing}
            />

            <ColorPicker
              label="Background Color"
              value={bgColor}
              onChange={setBgColor}
            />

            <ColorPicker
              label="Text Color"
              value={textColor}
              onChange={setTextColor}
            />

            <InputControls
              onFileUpload={handleFileUpload}
              onOpenCamera={() => setShowCamera(true)}
              isOCRBusy={ocrBusy}
            />

            <TTSControls
              rate={rate}
              setRate={setRate}
              onStop={stop}
              onRead={() => speak(text, rate)}
              onReadWithHighlights={() => speakWithHighlight(text, rate)}
              onSummarize={summarizeText}
              isSummarizing={summarizing}
            />
          </div>

          {/* Right Side - Editor */}
          <div className="col-span-3">
            <label className="font-semibold">Editor</label>

            <TextEditor
              text={text}
              setText={setText}
              fontSize={fontSize}
              lineHeight={lineHeight}
              letterSpacing={letterSpacing}
              bgColor={bgColor}
              textColor={textColor}
              fontFamily={fontFamily}
              isHighlighting={isHighlighting}
              currentWordIndex={currentWordIndex}
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => navigator.clipboard.writeText(text)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Copy
              </button>
              <button
                onClick={() => setText("")}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition"
              >
                Clear
              </button>
            </div>

            <SummaryDisplay summary={summary} />
          </div>
        </div>
      </div>
    </div>
  );
}
