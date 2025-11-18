import React from "react";
import RangeSlider from "../common/RangeSlider";

export default function VoiceControls({
  voice,
  setVoice,
  playRate,
  setPlayRate,
  onGenerateTTS,
  onReadWithHighlights,
  isLoading,
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="font-semibold">Voice (backend)</label>
        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          className="w-full p-2 border rounded mt-2"
        >
          <option value="alloy">Alloy</option>
          <option value="nova">Nova</option>
          <option value="verse">Verse</option>
        </select>
      </div>

      <RangeSlider
        label="Playback Speed"
        value={playRate}
        onChange={setPlayRate}
        min={0.5}
        max={2}
        step={0.1}
        unit="x"
      />

      <div className="flex gap-2">
        <button
          onClick={onGenerateTTS}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50"
        >
          {isLoading ? "Generating…" : "Generate Audio"}
        </button>
        <button
          onClick={onReadWithHighlights}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Read with Highlights
        </button>
      </div>
    </div>
  );
}
