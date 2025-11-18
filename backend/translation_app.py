"""
Simple Translation API - No model loading, just translation service
Fast and lightweight backend for translation only.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from googletrans import Translator

app = Flask(__name__)
CORS(app)

# Initialize translator
translator = Translator()

# Language code mapping
LANGUAGE_MAP = {
    "Hindi": "hi",
    "Kannada": "kn",
    "Tamil": "ta",
    "Telugu": "te",
    "Malayalam": "ml",
    "French": "fr",
    "Spanish": "es",
    "English": "en"
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "translation",
        "supported_languages": list(LANGUAGE_MAP.keys())
    })

@app.route('/translate', methods=['POST'])
def translate():
    """
    Translation endpoint
    Expects JSON: {"text": "Your text here", "targetLang": "Hindi"}
    Returns: JSON with translated text
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
        
        if 'targetLang' not in data:
            return jsonify({"error": "Missing 'targetLang' field in request"}), 400
        
        text = data['text']
        target_lang = data['targetLang']
        
        # Validate text
        if not text or not text.strip():
            return jsonify({"error": "Text cannot be empty"}), 400
        
        # Get language code
        target_code = LANGUAGE_MAP.get(target_lang)
        if not target_code:
            return jsonify({"error": f"Unsupported language: {target_lang}"}), 400
        
        print(f"Translating to {target_lang} ({target_code})...")
        
        # Perform translation
        result = translator.translate(text, dest=target_code)
        
        return jsonify({
            "translated": result.text,
            "source_language": result.src,
            "target_language": target_lang,
            "target_code": target_code
        })
    
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        print(f"TRANSLATION ERROR: {err}")
        return jsonify({
            "error": "Translation failed",
            "details": str(err)
        }), 500

@app.route('/detect-language', methods=['POST'])
def detect_language():
    """
    Language detection endpoint
    Expects JSON: {"text": "Your text here"}
    Returns: JSON with detected language and confidence
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
        
        text = data['text']
        
        if not text or not text.strip():
            return jsonify({"error": "Text cannot be empty"}), 400
        
        detection = translator.detect(text)
        
        return jsonify({
            "language": detection.lang,
            "confidence": detection.confidence
        })
    
    except Exception as err:
        print(f"LANGUAGE DETECTION ERROR: {err}")
        return jsonify({
            "error": "Language detection failed",
            "details": str(err)
        }), 500

@app.route('/supported-languages', methods=['GET'])
def supported_languages():
    """
    Get list of supported languages for translation
    Returns: JSON with list of supported languages
    """
    return jsonify({"languages": list(LANGUAGE_MAP.keys())})

if __name__ == '__main__':
    print("=" * 60)
    print("🌍 Translation API Server Starting...")
    print("=" * 60)
    print(f"✓ Server running on: http://localhost:6969")
    print(f"✓ Supported languages: {', '.join(LANGUAGE_MAP.keys())}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=6969, debug=True)
