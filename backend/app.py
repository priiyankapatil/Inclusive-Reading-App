from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import requests
import os

app = Flask(__name__)
CORS(app)


GOOGLE_API_KEY = "AIzaSyBsunR0HAa_z-CMWt5vabpUlzL5S_NyYbE"
VISION_URL = f"https://vision.googleapis.com/v1/images:annotate?key={GOOGLE_API_KEY}"


@app.route("/ocr", methods=["POST"])
def ocr_image():
    try:
        data = request.json
        image_base64 = data.get("image")

        if not image_base64:
            return jsonify({"error": "No image provided"}), 400

        # Google Vision request body
        body = {
            "requests": [
                {
                    "image": {"content": image_base64},
                    "features": [{"type": "DOCUMENT_TEXT_DETECTION"}]
                }
            ]
        }

        response = requests.post(VISION_URL, json=body)
        result = response.json()

        text = (
            result.get("responses", [{}])[0]
            .get("fullTextAnnotation", {})
            .get("text", "")
        )

        return jsonify({"text": text})

    except Exception as e:
        print("OCR ERROR:", e)
        return jsonify({"error": "OCR failed"}), 500


app.run(host="0.0.0.0", port=5000)
