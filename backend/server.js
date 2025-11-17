// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import vision from "@google-cloud/vision";
import { OpenAI } from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "100mb" })); // handles large images

// -------------------------------------
// HEALTH CHECK
// -------------------------------------
app.get("/health", (_, res) => res.json({ ok: true }));

// -------------------------------------
// GOOGLE VISION CLIENT
// -------------------------------------
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// -------------------------------------
// OPENAI CLIENT
// -------------------------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ======================================================================
// 📌 1) OCR ENDPOINT
// ======================================================================
app.post("/ocr", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No image provided" });

    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64, "base64");

    const [result] = await visionClient.documentTextDetection({
      image: { content: buffer },
    });

    const text = result?.fullTextAnnotation?.text || "";
    return res.json({ text });
  } catch (err) {
    console.error("OCR ERROR:", err);
    return res.status(500).json({ error: "OCR failed", details: String(err) });
  }
});

// ======================================================================
// 📌 2) SUMMARIZER ENDPOINT
// ======================================================================
app.post("/summarize", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Summarize clearly, simply, and concisely. Make it easy for students.",
        },
        { role: "user", content: text },
      ],
    });

    const summary = completion.choices?.[0]?.message?.content || "";
    return res.json({ summary });
  } catch (err) {
    console.error("SUMMARIZE ERROR:", err);
    return res.status(500).json({ error: "Summarization failed", details: String(err) });
  }
});

// ======================================================================
// 📌 3) TRANSLATION ENDPOINT
// ======================================================================
app.post("/translate", async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang)
      return res.status(400).json({ error: "Missing text/language" });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: `Translate this text to ${targetLang}.` },
        { role: "user", content: text },
      ],
    });

    const translated = completion.choices?.[0]?.message?.content || "";
    return res.json({ translated });
  } catch (err) {
    console.error("TRANSLATION ERROR:", err);
    return res.status(500).json({ error: "Translation failed", details: String(err) });
  }
});

// ======================================================================
// 📌 4) TEXT-TO-SPEECH ENDPOINT
// ======================================================================
app.post("/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;

    if (!text) return res.status(400).json({ error: "No text provided" });

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voice || "alloy", // default voice
      input: text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64Audio = buffer.toString("base64");

    return res.json({ audio: base64Audio });
  } catch (err) {
    console.error("TTS ERROR:", err);
    return res.status(500).json({ error: "TTS failed", details: String(err) });
  }
});

// ======================================================================
// START SERVER
// ======================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
