"""
Combined API for Summarization and Text-to-Speech
This API provides endpoints for both text summarization and TTS synthesis.

Installation:
pip install flask transformers torch huggingface_hub tqdm accelerate scipy numpy
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from services.summarization_service import SummarizationService
from services.tts_service import TTSService
from services.ocr_service import OCRService
from services.translation_service import TranslationService

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize services
summarization_service = SummarizationService()
tts_service = TTSService()
ocr_service = OCRService()
translation_service = TranslationService()

@app.before_request
def initialize():
    """Initialize models before first request"""
    # Initialize summarization model if not already loaded
    if not summarization_service.is_initialized():
        try:
            summarization_service.initialize()
        except Exception as e:
            print(f"Warning: Failed to initialize summarization service: {e}")
    
    # Initialize TTS model if not already loaded
    if not tts_service.is_initialized():
        try:
            tts_service.initialize()
        except Exception as e:
            print(f"Warning: Failed to initialize TTS service: {e}")
    
    # Initialize translation service if not already loaded
    if not translation_service.is_initialized():
        try:
            translation_service.initialize()
        except Exception as e:
            print(f"Warning: Failed to initialize translation service: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "services": {
            "summarization": {
                "model": summarization_service.MODEL_NAME,
                "device": summarization_service.get_device(),
                "loaded": summarization_service.is_initialized()
            },
            "tts": {
                "model": tts_service.MODEL_NAME,
                "device": tts_service.get_device(),
                "loaded": tts_service.is_initialized()
            },
            "ocr": {
                "loaded": ocr_service.is_initialized(),
                "api_configured": ocr_service.is_initialized()
            },
            "translation": {
                "loaded": translation_service.is_initialized(),
                "supported_languages": TranslationService.get_supported_languages()
            }
        }
    })

@app.route('/summarize', methods=['POST'])
def summarize():
    """
    Summarization endpoint
    Expects JSON: {"text": "Your text to summarize here"}
    Returns: JSON with summary
    """
    try:
        # Get text from request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "No text provided"}), 400
        
        text = data['text']
        
        # Use the summarization service
        summary = summarization_service.summarize(text)
        
        return jsonify({"summary": summary})
    
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        print(f"SUMMARIZE ERROR: {err}")
        return jsonify({
            "error": "Summarization failed",
            "details": str(err)
        }), 500

@app.route('/chat', methods=['POST'])
def chat():
    """
    General chat endpoint for any text generation task
    Expects JSON: {"messages": [{"role": "user", "content": "..."}], "max_tokens": 500, "temperature": 0.7}
    Returns: JSON with response
    """
    try:
        data = request.get_json()
        if not data or 'messages' not in data:
            return jsonify({"error": "No messages provided"}), 400
        
        messages = data['messages']
        max_tokens = data.get('max_tokens', 500)
        temperature = data.get('temperature', 0.7)
        
        # Use the summarization service for chat
        response = summarization_service.chat(messages, max_tokens, temperature)
        
        return jsonify({"response": response})
    
    except Exception as err:
        print(f"CHAT ERROR: {err}")
        return jsonify({
            "error": "Chat generation failed",
            "details": str(err)
        }), 500


# ============================================================================
# Text-to-Speech Endpoints
# ============================================================================

@app.route('/tts', methods=['POST'])
def tts():
    """
    TTS endpoint for frontend - Returns base64 encoded audio in JSON
    Expects JSON: {"text": "Your text here", "voice": "alloy" (optional)}
    Returns: JSON with base64 encoded audio
    """
    try:
        # Check if TTS service is initialized
        if not tts_service.is_initialized():
            return jsonify({
                "error": "TTS service not available",
                "details": "The TTS model is not initialized. Please enable model downloading in tts_service.py"
            }), 503
        
        # Get data from request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
        
        text = data['text']
        voice = data.get('voice', 'alloy')  # Voice parameter for future use
        
        # Use the TTS service
        result = tts_service.synthesize_base64(text)
        
        return jsonify(result)
    
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        print(f"TTS ERROR: {err}")
        return jsonify({
            "error": "Text-to-speech synthesis failed",
            "details": str(err)
        }), 500


@app.route('/synthesize', methods=['POST'])
def synthesize_speech():
    """
    TTS endpoint - Returns audio file
    Expects JSON: {"text": "Your text here"}
    Returns: Audio file (WAV format)
    """
    try:
        # Check if TTS service is initialized
        if not tts_service.is_initialized():
            return jsonify({
                "error": "TTS service not available",
                "details": "The TTS model is not initialized. Please enable model downloading in tts_service.py"
            }), 503
        
        # Get text from request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
        
        text = data['text']
        
        # Use the TTS service
        audio_buffer, _ = tts_service.synthesize(text)
        
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
    
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        print(f"TTS ERROR: {err}")
        return jsonify({
            "error": "Text-to-speech synthesis failed",
            "details": str(err)
        }), 500


@app.route('/synthesize_json', methods=['POST'])
def synthesize_json():
    """
    Alternative TTS endpoint - Returns base64 encoded audio in JSON
    Expects JSON: {"text": "Your text here"}
    Returns: JSON with base64 encoded audio
    """
    try:
        # Get text from request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
        
        text = data['text']
        
        # Use the TTS service
        result = tts_service.synthesize_base64(text)
        
        return jsonify(result)
    
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        print(f"TTS JSON ERROR: {err}")
        return jsonify({
            "error": "Text-to-speech synthesis failed",
            "details": str(err)
        }), 500


# ============================================================================
# OCR Endpoints
# ============================================================================

@app.route('/ocr', methods=['POST'])
def ocr():
    """
    OCR endpoint - Extracts text from image
    Expects JSON: {"image": "base64_encoded_image_data"}
    Returns: JSON with extracted text
    """
    try:
        # Get image data from request
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "Missing 'image' field in request"}), 400
        
        image_data = data['image']
        language = data.get('language', 'eng')  # Default to English
        
        # Use the OCR service
        extracted_text = ocr_service.extract_text_from_base64(image_data, language=language)
        
        return jsonify({"text": extracted_text})
    
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    except Exception as err:
        print(f"OCR ERROR: {err}")
        return jsonify({
            "error": "OCR processing failed",
            "details": str(err)
        }), 500


# ============================================================================
# Translation Endpoints
# ============================================================================

@app.route('/translate', methods=['POST'])
def translate():
    """
    Translation endpoint
    Expects JSON: {"text": "Your text here", "targetLang": "Hindi"}
    Returns: JSON with translated text
    """
    try:
        # Get data from request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
        
        if 'targetLang' not in data:
            return jsonify({"error": "Missing 'targetLang' field in request"}), 400
        
        text = data['text']
        target_lang = data['targetLang']
        
        # Use the translation service
        result = translation_service.translate(text, target_lang)
        
        return jsonify(result)
    
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
        # Get data from request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
        
        text = data['text']
        
        # Use the translation service
        result = translation_service.detect_language(text)
        
        return jsonify(result)
    
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
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
    try:
        languages = TranslationService.get_supported_languages()
        return jsonify({"languages": languages})
    except Exception as err:
        print(f"SUPPORTED LANGUAGES ERROR: {err}")
        return jsonify({
            "error": "Failed to retrieve supported languages",
            "details": str(err)
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6969, debug=True)