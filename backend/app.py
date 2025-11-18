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
# from services.translation_service import TranslationService  # Temporarily disabled due to dependency conflicts

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Initialize services
summarization_service = SummarizationService()
tts_service = TTSService()
# translation_service = TranslationService()  # Temporarily disabled

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
    # Temporarily disabled due to dependency conflicts
    # if not translation_service.is_initialized():
    #     try:
    #         translation_service.initialize()
    #     except Exception as e:
    #         print(f"Warning: Failed to initialize translation service: {e}")

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
            "translation": {
                "loaded": False,
                "supported_languages": []
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

@app.route('/synthesize', methods=['POST'])
def synthesize_speech():
    """
    TTS endpoint - Returns audio file
    Expects JSON: {"text": "Your text here"}
    Returns: Audio file (WAV format)
    """
    try:
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
# Translation Endpoints
# ============================================================================

@app.route('/translate', methods=['POST'])
def translate():
    """
    Translation endpoint - TEMPORARILY DISABLED
    Expects JSON: {"text": "Your text here", "targetLang": "Hindi"}
    Returns: JSON with translated text
    """
    return jsonify({"error": "Translation service temporarily disabled due to dependency conflicts"}), 503


@app.route('/detect-language', methods=['POST'])
def detect_language():
    """
    Language detection endpoint - TEMPORARILY DISABLED
    Expects JSON: {"text": "Your text here"}
    Returns: JSON with detected language and confidence
    """
    return jsonify({"error": "Language detection service temporarily disabled due to dependency conflicts"}), 503


@app.route('/supported-languages', methods=['GET'])
def supported_languages():
    """
    Get list of supported languages for translation - TEMPORARILY DISABLED
    Returns: JSON with list of supported languages
    """
    return jsonify({"error": "Translation service temporarily disabled due to dependency conflicts"}), 503


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6969, debug=True)