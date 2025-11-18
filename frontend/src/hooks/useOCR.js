import { useState, useCallback } from "react";

const BASE_URL = "http://localhost:6969";

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false);

  const compressImage = useCallback(async (dataUrl, maxWidth = 1000, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }, []);

  const extractText = useCallback(async (dataUrl) => {
    try {
      setIsProcessing(true);
      const res = await fetch(`${BASE_URL}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      const json = await res.json();
      if (json.error) {
        console.error("OCR backend returned error:", json);
        return "";
      }
      return json.text || "";
    } catch (err) {
      console.error("OCR Backend Error:", err);
      alert("OCR failed — check backend is running. See console.");
      return "";
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processImage = useCallback(async (dataUrl) => {
    const compressed = await compressImage(dataUrl);
    const text = await extractText(compressed);
    return text;
  }, [compressImage, extractText]);

  return {
    isProcessing,
    compressImage,
    extractText,
    processImage,
  };
}
