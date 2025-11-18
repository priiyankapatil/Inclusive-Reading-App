import React from "react";
import Webcam from "react-webcam";

export default function CameraCapture({ 
  webcamRef, 
  onCapture, 
  onClose, 
  isOpen 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow w-[350px]">
        <h3 className="font-semibold mb-2">Capture Image</h3>
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/png"
          videoConstraints={{ facingMode: "environment" }}
          className="rounded mb-3"
        />
        <button
          onClick={onCapture}
          className="w-full bg-green-600 text-white p-2 rounded mb-2 hover:bg-green-700 transition"
        >
          Capture
        </button>
        <button
          onClick={onClose}
          className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
