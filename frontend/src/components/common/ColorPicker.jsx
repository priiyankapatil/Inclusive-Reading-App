import React from "react";

export default function ColorPicker({ label, value, onChange }) {
  return (
    <div className="p-3 bg-white/70 rounded flex items-center gap-3">
      <div style={{ flex: 1 }}>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 mt-2 rounded"
        />
      </div>
      <div
        style={{
          width: 48,
          height: 34,
          borderRadius: 6,
          border: "1px solid #ddd",
          background: value,
        }}
        aria-hidden
      />
    </div>
  );
}
