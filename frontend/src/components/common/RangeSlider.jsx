import React from "react";

export default function RangeSlider({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1, 
  unit = "" 
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}: {value}{unit}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-2"
      />
    </div>
  );
}
