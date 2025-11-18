import React from "react";

export default function HighlightedText({ 
  text, 
  currentWordIndex,
  fontSize = 16,
  lineHeight = 1.6,
  bgColor = "#fff",
  textColor = "#111"
}) {
  const tokens = text.split(/\s+/);
  
  return (
    <div
      style={{
        fontSize,
        lineHeight,
        background: bgColor,
        padding: 12,
        borderRadius: 8,
        color: textColor,
      }}
    >
      {tokens.map((t, i) => (
        <span
          key={i}
          style={{
            backgroundColor: i === currentWordIndex ? "yellow" : "transparent",
            padding: "2px 4px",
            borderRadius: 3,
            marginRight: 2,
            display: "inline-block",
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
