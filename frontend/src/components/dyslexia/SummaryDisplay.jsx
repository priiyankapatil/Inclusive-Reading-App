import React from "react";

export default function SummaryDisplay({ summary }) {
  return (
    <div className="mt-4 p-4 bg-white/70 rounded border">
      <label className="font-semibold">Summary</label>
      <div className="mt-2 whitespace-pre-wrap min-h-[60px]">
        {summary || "No summary yet."}
      </div>
    </div>
  );
}
