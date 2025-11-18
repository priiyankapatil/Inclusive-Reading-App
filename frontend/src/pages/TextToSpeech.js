// src/pages/TextToSpeech.js
import React, { useState, useRef } from "react";
import PageHeader from "../components/common/PageHeader";
import CameraCapture from "../components/common/CameraCapture";
import HighlightedText from "../components/common/HighlightedText";
import TextInputArea from "../components/tts/TextInputArea";
import VoiceControls from "../components/tts/VoiceControls";
import AudioPlayer from "../components/tts/AudioPlayer";
import { useOCR } from "../hooks/useOCR";
import { useFileUpload } from "../hooks/useFileUpload";
import { useTTS } from "../hooks/useTTS";
import "../pdf-worker";

const BASE = "http://localhost:6969";

export default function TextToSpeech() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [playRate, setPlayRate] = useState(1.0);
  
  const audioRef = useRef(null);
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  // Custom hooks
  const { isProcessing: ocrBusy, processImage } = useOCR();
  const { processFile } = useFileUpload();
  const { isReading: isHighlighting, currentWordIndex, speakWithHighlight } = useTTS();

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

  function downloadAudio() {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "speech.mp3";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-6">
      <div className="glass-card p-6 max-w-4xl w-full">
        <PageHeader title="Text to Speech" />

        <CameraCapture
          webcamRef={webcamRef}
          onCapture={captureImage}
          onClose={() => setShowCamera(false)}
          isOpen={showCamera}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input */}
          {!isHighlighting ? (
            <TextInputArea
              text={text}
              setText={setText}
              onFileUpload={handleFileUpload}
              onOpenCamera={() => setShowCamera(true)}
              isOCRBusy={ocrBusy}
            />
          ) : (
            <div className="col-span-2">
              <HighlightedText text={text} currentWordIndex={currentWordIndex} />
            </div>
          )}

          {/* Right: Controls */}
          <div>
            <VoiceControls
              voice={voice}
              setVoice={setVoice}
              playRate={playRate}
              setPlayRate={setPlayRate}
              onGenerateTTS={generateTTS}
              onReadWithHighlights={() => speakWithHighlight(text, playRate)}
              isLoading={loading}
            />

            <AudioPlayer
              audioRef={audioRef}
              audioUrl={audioUrl}
              onPlay={() => {
                if (audioRef.current) {
                  audioRef.current.playbackRate = playRate;
                  audioRef.current.play();
                }
              }}
              onPause={() => {
                if (audioRef.current) audioRef.current.pause();
              }}
              onDownload={downloadAudio}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
