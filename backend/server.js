import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import vision from "@google-cloud/vision";
import { OpenAI } from "openai";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors());

// ----------------------------
// GOOGLE VISION CLIENT (JSON)
// ----------------------------
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// ----------------------------
// OPENAI CLIENT
// ----------------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ----------------------------
// OCR ENDPOINT
// ----------------------------
app.post("/ocr", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No image provided" });

    const [result] = await visionClient.documentTextDetection({
      image: { content: image.replace(/^data:image\/\w+;base64,/, "") },
    });

    const text = result.fullTextAnnotation?.text || "";
    res.json({ text });
  } catch (err) {
    console.error("OCR ERROR:", err);
    res.status(500).json({ error: "OCR failed" });
  }
});

// ----------------------------
// SUMMARIZER ENDPOINT
// ----------------------------
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

    const summary = completion.choices[0].message.content;
    res.json({ summary });
  } catch (err) {
    console.error("SUMMARIZE ERROR:", err);
    res.status(500).json({ error: "Summarization failed" });
  }
});

// ----------------------------
app.listen(process.env.PORT, () => {
  console.log("Backend running on port", process.env.PORT);
});
