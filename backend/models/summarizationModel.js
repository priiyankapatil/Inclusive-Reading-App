// -------------------------------
// server.js
// Google Vision OCR + GPT-4o Summarizer Backend
// -------------------------------

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// GOOGLE VISION IMPORT
import vision from "@google-cloud/vision";

// OPENAI IMPORT
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

// ---------- Multer for file uploads ----------
const upload = multer({ dest: "uploads/" });

// ---------- Load OpenAI ----------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ---------- Load Google Vision Client ----------
const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// --------------------------------------
// ROUTE 1: Summarization (GPT-4o-mini)
// --------------------------------------
app.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "No text provided" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a highly accurate text summarizer. Provide clean, short, meaningful summaries."
        },
        {
          role: "user",
          content: `Summarize the following text:\n\n${text}`
        }
      ]
    });

    const summary = response.choices[0].message.content;

    return res.json({ summary });
  } catch (err) {
    console.error("Summarization ERROR:", err);
    res.status(500).json({ error: "Summarization failed" });
  }
});

// --------------------------------------
// ROUTE 2: GOOGLE VISION OCR (Image -> Text)
// --------------------------------------
app.post("/ocr-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const filePath = path.join(__dirname, req.file.path);

    const [result] = await client.textDetection(filePath);
    const detections = result.textAnnotations;

    fs.unlinkSync(filePath); // delete temp file

    const extractedText = detections?.[0]?.description || "";

    return res.json({ text: extractedText });
  } catch (err) {
    console.error("OCR ERROR:", err);
    res.status(500).json({ error: "OCR failed" });
  }
});

// -------------------------------
// START SERVER
// -------------------------------
app.listen(5000, () => {
  console.log("🚀 Backend running at http://localhost:5000");
});
