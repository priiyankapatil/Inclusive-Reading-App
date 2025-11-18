import React from "react";
import FileUploader from "../common/FileUploader";

export default function TranslationInput({ 
  text, 
  setText, 
  onFileUpload,
  onOpenCamera 
}) {
  return (
    <div>
      <label className="font-semibold">Enter or Upload Text</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        className="w-full p-3 mt-2 rounded border"
        placeholder="Type or paste text here..."
      />

      <FileUploader
        onFileSelect={onFileUpload}
        accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.bmp"
        label=""
        className="mt-2"
      />

      <button
        onClick={onOpenCamera}
        className="w-full p-2 bg-blue-600 text-white rounded mt-2 hover:bg-blue-700 transition"
      >
        📷 Open Camera
      </button>
    </div>
  );
}
