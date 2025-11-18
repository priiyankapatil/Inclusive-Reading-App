import React from "react";

export function computeFontFamilyCSS(name) {
  return name === "OpenDyslexic" ? "OpenDyslexic, Arial, sans-serif" : name;
}

export function HighlightedText({ text, currentWordIndex, fontSize, lineHeight, letterSpacing, bgColor, textColor, fontFamily }) {
  const tokens = text.split(/\s+/);
  
  return (
    <div
      style={{
        fontSize: `${fontSize}px`,
        lineHeight,
        letterSpacing: `${letterSpacing}px`,
        background: bgColor,
        color: textColor,
        fontFamily: computeFontFamilyCSS(fontFamily),
        padding: 16,
        borderRadius: 8,
      }}
    >
      {tokens.map((t, i) => (
        <span
          key={i}
          style={{
            backgroundColor: i === currentWordIndex ? "yellow" : "transparent",
            padding: "2px 4px",
            borderRadius: 4,
          }}
        >
          {t}{" "}
        </span>
      ))}
    </div>
  );
}

export default function TextEditor({
  text,
  setText,
  fontSize,
  lineHeight,
  letterSpacing,
  bgColor,
  textColor,
  fontFamily,
  isHighlighting,
  currentWordIndex,
}) {
  if (isHighlighting) {
    return (
      <HighlightedText
        text={text}
        currentWordIndex={currentWordIndex}
        fontSize={fontSize}
        lineHeight={lineHeight}
        letterSpacing={letterSpacing}
        bgColor={bgColor}
        textColor={textColor}
        fontFamily={fontFamily}
      />
    );
  }

  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      rows={12}
      style={{
        fontSize: `${fontSize}px`,
        lineHeight,
        letterSpacing: `${letterSpacing}px`,
        background: bgColor,
        color: textColor,
        fontFamily: computeFontFamilyCSS(fontFamily),
      }}
      className="w-full p-4 mt-2 rounded resize-vertical"
    />
  );
}
