import React from "react";
import RangeSlider from "../common/RangeSlider";

export default function TTSControls({
  rate,
  setRate,
  onStop,
  onRead,
  onReadWithHighlights,
  onSummarize,
  isSummarizing,
}) {
  return (
    <div className="p-3 bg-white/70 rounded space-y-3">
      <RangeSlider
        label="Reading Speed"
        value={rate}
        onChange={setRate}
        min={0.5}
        max={2}
        step={0.1}
        unit="x"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={onStop}
          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          ⏹
        </button>
        <button
          onClick={onRead}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          ▶ Read
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onStop}
          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          ⏹
        </button>
        <button
          onClick={onReadWithHighlights}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Read with Highlights
        </button>
      </div>

      <button
        onClick={onSummarize}
        disabled={isSummarizing}
        className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {isSummarizing ? "Summarizing…" : "Summarize"}
      </button>
    </div>
  );
}
