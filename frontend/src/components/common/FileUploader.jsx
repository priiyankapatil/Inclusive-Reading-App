import React from "react";

export default function FileUploader({ 
  onFileSelect, 
  accept = ".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.bmp",
  label = "Upload File",
  className = ""
}) {
  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700 block mb-2">
        {label}
      </label>
      <input
        type="file"
        accept={accept}
        onChange={onFileSelect}
        className="w-full border p-2 rounded"
      />
    </div>
  );
}
