import express from "express";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* =====================================================
   🔵 OCR ENDPOINT (same used for Translation & TTS too)
===================================================== */
router.post("/ocr", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const vision = await import("@google-cloud/vision");
    const client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    const [result] = await client.documentTextDetection({
      image: { content: image.replace(/^data:image\/\w+;base64,/, "") },
    });

    res.json({ text: result.fullTextAnnotation?.text || "" });
  } catch (err) {
    console.error("OCR error:", err);
    res.status(500).json({ error: "OCR failed" });
  }
});

/* =====================================================
   🌍 TRANSLATION
===================================================== */
router.post("/translate", async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ error: "Missing text or language" });
    }

    const result = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: `Translate into ${targetLang}.` },
        { role: "user", content: text },
      ],
    });

    res.json({ translated: result.choices[0].message.content });
  } catch (err) {
    console.error("Translate error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

/* =====================================================
   🔊 TEXT TO SPEECH (TTS)
===================================================== */
router.post("/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text missing" });
    }

    const output = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voice || "alloy",
      input: text,
    });

    const buffer = Buffer.from(await output.arrayBuffer());
    res.json({ audio: buffer.toString("base64") });
  } catch (err) {
    console.error("TTS Error:", err);
    res.status(500).json({ error: "TTS failed" });
  }
});

export default router;
