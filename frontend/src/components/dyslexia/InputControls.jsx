import React from "react";
import FileUploader from "../common/FileUploader";

export default function InputControls({
  onFileUpload,
  onOpenCamera,
  isOCRBusy,
}) {
  return (
    <div className="p-3 bg-white/70 rounded space-y-2">
      <FileUploader
        onFileSelect={onFileUpload}
        label="Upload File"
        accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.bmp"
      />
      <button
        onClick={onOpenCamera}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
      >
        📷 Open Camera
      </button>
      {isOCRBusy && (
        <p className="text-sm text-orange-600 mt-1">
          OCR running… please wait
        </p>
      )}
    </div>
  );
}
