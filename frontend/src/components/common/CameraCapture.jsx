import React, { useState, useEffect } from "react";
import Webcam from "react-webcam";

export default function CameraCapture({ 
  webcamRef, 
  onCapture, 
  onClose, 
  isOpen 
}) {
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState("pending");

  useEffect(() => {
    if (!isOpen) return;

    // Request camera permission
    const requestCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());
        setPermissionStatus("granted");
        setError(null);
      } catch (err) {
        console.error("Camera access error:", err);
        setPermissionStatus("denied");
        
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else if (err.name === "NotReadableError") {
          setError("Camera is already in use by another application.");
        } else {
          setError(`Camera error: ${err.message}`);
        }
      }
    };

    requestCameraPermission();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow w-[350px] max-w-[90vw]">
        <h3 className="font-semibold mb-2">Capture Image</h3>
        
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        ) : permissionStatus === "pending" ? (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-3 py-2 rounded mb-3 text-sm">
            Requesting camera access...
          </div>
        ) : null}

        {permissionStatus === "granted" && !error && (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/png"
            videoConstraints={{ 
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }}
            className="rounded mb-3 w-full"
            onUserMediaError={(err) => {
              console.error("Webcam error:", err);
              setError("Failed to access camera. Please check permissions.");
            }}
          />
        )}

        <button
          onClick={onCapture}
          disabled={permissionStatus !== "granted" || error}
          className="w-full bg-green-600 text-white p-2 rounded mb-2 hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
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
