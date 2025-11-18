import React, { useState } from "react";
import PageHeader from "../components/common/PageHeader";
import SummarizationInput from "../components/summarization/SummarizationInput";
import SummarizationOutput from "../components/summarization/SummarizationOutput";
import { useTTS } from "../hooks/useTTS";

export default function Summarization() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [fileName, setFileName] = useState("");
  
  const { isReading, speak, stop } = useTTS();

  async function handleSummarize() {
    if (!text.trim()) {
      alert("Please enter text.");
      return;
    }

    try {
      const response = await fetch("http://localhost:6969/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error(error);
      alert("Backend not connected!");
    }
  }

  function readSummary() {
    if (!("speechSynthesis" in window) || !summary) {
      alert("No summary or TTS not supported.");
      return;
    }
    speak(summary);
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setText(reader.result);
    };
    reader.readAsText(file);
  }

  function handleClear() {
    setText("");
    setSummary("");
    setFileName("");
    stop();
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-6">
      <div className="glass-card center-max p-6">
        <PageHeader title="Summarization" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SummarizationInput
            text={text}
            setText={setText}
            onSummarize={handleSummarize}
            onClear={handleClear}
            fileName={fileName}
            onFileUpload={handleFileUpload}
          />

          <SummarizationOutput
            summary={summary}
            onRead={readSummary}
            onCopy={() => {
              navigator.clipboard.writeText(summary);
              alert("Copied");
            }}
            isReading={isReading}
          />
        </div>
      </div>
    </div>
  );
}
