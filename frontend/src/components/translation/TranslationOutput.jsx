import React from "react";

const LANGUAGES = [
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Malayalam",
  "French",
  "Spanish",
];

export default function TranslationOutput({ 
  translated, 
  targetLang,
  setTargetLang,
  onTranslate,
  isLoading 
}) {
  return (
    <div>
      <label className="font-semibold">Output Translation</label>

      <select
        value={targetLang}
        onChange={(e) => setTargetLang(e.target.value)}
        className="w-full p-2 border rounded mt-2"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>

      <button
        onClick={onTranslate}
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white p-2 rounded mt-3 hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {isLoading ? "Translating…" : "Translate"}
      </button>

      <div className="border bg-white/70 p-3 rounded mt-4 min-h-[120px] whitespace-pre-wrap">
        {translated || "No translation yet."}
      </div>
    </div>
  );
}
