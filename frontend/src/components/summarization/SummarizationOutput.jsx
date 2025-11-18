import React from "react";

export default function SummarizationOutput({ 
  summary, 
  onRead,
  onCopy,
  isReading 
}) {
  return (
    <div>
      <label className="font-semibold">Summary</label>
      <div className="p-4 mt-2 rounded-lg bg-white/60 min-h-[200px]">
        {summary || (
          <div className="text-gray-500">
            No summary yet — click Summarize.
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onRead}
            disabled={!summary || isReading}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
          >
            Read Summary
          </button>
          <button
            onClick={onCopy}
            disabled={!summary}
            className="px-4 py-2 rounded border hover:bg-gray-100 transition disabled:opacity-50"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
