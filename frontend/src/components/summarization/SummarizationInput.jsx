import React from "react";
import { Upload } from "lucide-react";

export default function SummarizationInput({ 
  text, 
  setText, 
  onSummarize,
  onClear,
  fileName,
  onFileUpload 
}) {
  return (
    <div>
      <label className="font-semibold">Input text or file</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        className="w-full p-4 mt-2 rounded-lg"
        placeholder="Paste text or upload a file..."
      />

      <div className="mt-3 flex flex-col gap-3">
        <label className="cursor-pointer flex items-center gap-2 bg-gray-200 px-3 py-2 rounded-lg w-fit hover:bg-gray-300 transition">
          <Upload size={18} />
          <span>{fileName || "Upload file (TXT only for now)"}</span>
          <input 
            type="file" 
            className="hidden" 
            onChange={onFileUpload} 
          />
        </label>

        <div className="flex gap-2">
          <button
            onClick={onSummarize}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Summarize
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2 rounded border hover:bg-gray-100 transition"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
