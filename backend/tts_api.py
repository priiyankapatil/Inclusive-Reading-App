"""
Maya1 Text-to-Speech API Endpoint
This API downloads the model once and uses it for all subsequent inference requests.
"""

from flask import Flask, request, jsonify, send_file
from transformers import pipeline
import torch
import os
import io
import scipy.io.wavfile as wavfile
import numpy as np
from huggingface_hub import snapshot_download

app = Flask(__name__)

# Configuration
MODEL_NAME = "maya-research/maya1"
MODEL_DIR = "./maya1_model"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Global variable to hold the pipeline
tts_pipeline = None

def download_model():
    """Download the model files to local directory"""
    print(f"Downloading model {MODEL_NAME} to {MODEL_DIR}...")
    try:
        snapshot_download(
            repo_id=MODEL_NAME,
            local_dir=MODEL_DIR,
            local_dir_use_symlinks=False,
            ignore_patterns=["*.md", "*.txt"]  # Skip unnecessary files
        )
        print("Model downloaded successfully!")
        return True
    except Exception as e:
        print(f"Error downloading model: {e}")
        return False

def load_model():
    """Load the model from local directory"""
    global tts_pipeline
    
    if not os.path.exists(MODEL_DIR):
        print("Model not found locally. Downloading...")
        if not download_model():
            raise Exception("Failed to download model")
    
    print(f"Loading model from {MODEL_DIR} on {DEVICE}...")
    try:
        tts_pipeline = pipeline(
            "text-to-speech",
            model=MODEL_DIR,
            device=0 if DEVICE == "cuda" else -1
        )
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        raise

@app.before_request
def initialize():
    """Initialize model before first request"""
    global tts_pipeline
    if tts_pipeline is None:
        load_model()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model": MODEL_NAME,
        "device": DEVICE,
        "model_loaded": tts_pipeline is not None
    })

@app.route('/synthesize', methods=['POST'])
def synthesize_speech():
    """
    Main TTS endpoint
    Expects JSON: {"text": "Your text here"}
    Returns: Audio file (WAV format)
    """
    try:
        # Get text from request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
        
        text = data['text']
        if not text.strip():
            return jsonify({"error": "Text cannot be empty"}), 400
        
        print(f"Synthesizing: {text[:50]}...")
        
        # Generate speech
        output = tts_pipeline(text)
        
        # Extract audio data
        audio_data = output['audio']
        sampling_rate = output['sampling_rate']
        
        # Convert to numpy array if it's a tensor
        if torch.is_tensor(audio_data):
            audio_data = audio_data.cpu().numpy()
        
        # Ensure audio is in correct format (int16)
        if audio_data.dtype != np.int16:
            audio_data = (audio_data * 32767).astype(np.int16)
        
        # Create WAV file in memory
        audio_buffer = io.BytesIO()
        wavfile.write(audio_buffer, sampling_rate, audio_data)
        audio_buffer.seek(0)
        
        return send_file(
            audio_buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
    
    except Exception as e:
        print(f"Error during synthesis: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/synthesize_json', methods=['POST'])
def synthesize_json():
    """
    Alternative endpoint that returns audio as base64 JSON
    Expects JSON: {"text": "Your text here"}
    Returns: JSON with base64 encoded audio
    """
    try:
        import base64
        
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400
        
        text = data['text']
        if not text.strip():
            return jsonify({"error": "Text cannot be empty"}), 400
        
        print(f"Synthesizing (JSON): {text[:50]}...")
        
        # Generate speech
        output = tts_pipeline(text)
        
        # Extract audio data
        audio_data = output['audio']
        sampling_rate = output['sampling_rate']
        
        # Convert to numpy array if it's a tensor
        if torch.is_tensor(audio_data):
            audio_data = audio_data.cpu().numpy()
        
        # Ensure audio is in correct format
        if audio_data.dtype != np.int16:
            audio_data = (audio_data * 32767).astype(np.int16)
        
        # Create WAV file in memory
        audio_buffer = io.BytesIO()
        wavfile.write(audio_buffer, sampling_rate, audio_data)
        audio_buffer.seek(0)
        
        # Encode to base64
        audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
        
        return jsonify({
            "audio": audio_base64,
            "sampling_rate": int(sampling_rate),
            "format": "wav"
        })
    
    except Exception as e:
        print(f"Error during synthesis: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # You can pre-download the model by uncommenting this:
    # if not os.path.exists(MODEL_DIR):
    #     download_model()
    
    app.run(host='0.0.0.0', port=5000, debug=True)