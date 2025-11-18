import React from "react";
import RangeSlider from "../common/RangeSlider";

const AVAILABLE_FONTS = [
  "Arial", "Verdana", "Helvetica", "Georgia", "Times New Roman", "OpenDyslexic",
  "Comic Sans MS", "Calibri", "Trebuchet MS", "Tahoma", "Courier New", "Inter",
  "Roboto", "Poppins", "Lato", "Ubuntu"
];

export default function TypographyControls({
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  letterSpacing,
  setLetterSpacing,
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-white/70 rounded">
        <label className="text-sm font-medium text-gray-700">Font Family</label>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
          className="w-full p-2 border rounded mt-2"
        >
          {AVAILABLE_FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="p-3 bg-white/70 rounded space-y-3">
        <RangeSlider
          label="Font Size"
          value={fontSize}
          onChange={setFontSize}
          min={14}
          max={48}
          unit="px"
        />
        
        <RangeSlider
          label="Line Height"
          value={lineHeight}
          onChange={setLineHeight}
          min={1}
          max={2.4}
          step={0.1}
        />
        
        <RangeSlider
          label="Letter Spacing"
          value={letterSpacing}
          onChange={setLetterSpacing}
          min={0}
          max={4}
          step={0.1}
          unit="px"
        />
      </div>
    </div>
  );
}
