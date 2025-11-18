import React from "react";
import FileUploader from "../common/FileUploader";

export default function TextInputArea({ 
  text, 
  setText, 
  onFileUpload,
  onOpenCamera,
  isOCRBusy,
  placeholder = "Type or paste text here..."
}) {
  return (
    <div className="col-span-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        className="w-full p-4 mt-2 rounded resize-vertical"
        placeholder={placeholder}
      />

      <div className="flex gap-2 mt-3">
        <FileUploader
          onFileSelect={onFileUpload}
          accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.bmp"
          className="flex-1"
        />
        <button
          onClick={onOpenCamera}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          📷 Camera
        </button>
      </div>

      {isOCRBusy && (
        <p className="text-sm text-orange-600 mt-1">
          OCR running… please wait
        </p>
      )}
    </div>
  );
}
