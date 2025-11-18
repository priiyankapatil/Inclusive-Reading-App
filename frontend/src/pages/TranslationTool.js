// src/pages/TranslationTool.js
import React, { useState, useRef } from "react";
import PageHeader from "../components/common/PageHeader";
import CameraCapture from "../components/common/CameraCapture";
import TranslationInput from "../components/translation/TranslationInput";
import TranslationOutput from "../components/translation/TranslationOutput";
import { useOCR } from "../hooks/useOCR";
import { useFileUpload } from "../hooks/useFileUpload";
import "../pdf-worker";

const BASE = "http://localhost:6969";

export default function TranslationTool() {
  const [text, setText] = useState("");
  const [translated, setTranslated] = useState("");
  const [lang, setLang] = useState("Hindi");
  const [loading, setLoading] = useState(false);

  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  // Custom hooks
  const { processImage } = useOCR();
  const { processFile } = useFileUpload();

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await processFile(file);
    if (result) {
      setText(result);
    }
    e.target.value = "";
  }

  async function captureImage() {
    const url = webcamRef.current?.getScreenshot();
    if (!url) return;

    const extracted = await processImage(url);
    setText(extracted);
    setShowCamera(false);
  }

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
        <PageHeader title="Translation Tool" />

        <CameraCapture
          webcamRef={webcamRef}
          onCapture={captureImage}
          onClose={() => setShowCamera(false)}
          isOpen={showCamera}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TranslationInput
            text={text}
            setText={setText}
            onFileUpload={handleFile}
            onOpenCamera={() => setShowCamera(true)}
          />

          <TranslationOutput
            translated={translated}
            targetLang={lang}
            setTargetLang={setLang}
            onTranslate={translate}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
}
