"""
Hermes-3-Llama-3.2-3B Summarization API Endpoint
This API downloads the model once and uses it for all subsequent inference requests.

Installation:
pip install flask transformers torch huggingface_hub tqdm accelerate
"""

from flask import Flask, request, jsonify
from transformers import pipeline
import torch
import os
from huggingface_hub import snapshot_download

app = Flask(__name__)

# Configuration
MODEL_NAME = "NousResearch/Hermes-3-Llama-3.2-3B"
MODEL_DIR = "./hermes3_model"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Global variable to hold the pipeline
text_gen_pipeline = None

def download_model():
    """Download the model files to local directory"""
    print("="*60)
    print(f"Starting model download...")
    print(f"Model: {MODEL_NAME}")
    print(f"Destination: {MODEL_DIR}")
    print("="*60)
    
    try:
        from tqdm import tqdm
        from huggingface_hub import HfApi
        
        # Get file list to show what will be downloaded
        api = HfApi()
        print("\nFetching model information...")
        model_info = api.model_info(MODEL_NAME)
        
        # List files that will be downloaded
        print(f"\nModel contains {len(model_info.siblings)} files")
        print("\nFiles to download:")
        for sibling in model_info.siblings[:10]:  # Show first 10 files
            print(f"  - {sibling.rfilename}")
        if len(model_info.siblings) > 10:
            print(f"  ... and {len(model_info.siblings) - 10} more files")
        
        print("\nDownloading model files...")
        snapshot_download(
            repo_id=MODEL_NAME,
            local_dir=MODEL_DIR,
            local_dir_use_symlinks=False,
            resume_download=True,
            tqdm_class=tqdm
        )
        
        print("\n" + "="*60)
        print("✓ Model downloaded successfully!")
        print(f"✓ Model saved to: {os.path.abspath(MODEL_DIR)}")
        print("="*60 + "\n")
        return True
        
    except Exception as e:
        print("\n" + "="*60)
        print(f"✗ Error downloading model: {e}")
        print("="*60 + "\n")
        return False

def load_model():
    """Load the model from local directory"""
    global text_gen_pipeline
    
    if not os.path.exists(MODEL_DIR):
        print("Model not found locally. Downloading...")
        if not download_model():
            raise Exception("Failed to download model")
    
    print(f"Loading model from {MODEL_DIR} on {DEVICE}...")
    try:
        text_gen_pipeline = pipeline(
            "text-generation",
            model=MODEL_DIR,
            device=0 if DEVICE == "cuda" else -1,
            torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32
        )
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        raise

@app.before_request
def initialize():
    """Initialize model before first request"""
    global text_gen_pipeline
    if text_gen_pipeline is None:
        load_model()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model": MODEL_NAME,
        "device": DEVICE,
        "model_loaded": text_gen_pipeline is not None
    })

@app.route('/summarize', methods=['POST'])
def summarize():
    """
    Summarization endpoint matching the OpenAI API style
    Expects JSON: {"text": "Your text to summarize here"}
    Returns: JSON with summary
    """
    try:
        # Get text from request
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "No text provided"}), 400
        
        text = data['text']
        if not text.strip():
            return jsonify({"error": "Text cannot be empty"}), 400
        
        print(f"Summarizing text (length: {len(text)} chars)...")
        
        # Create messages in chat format
        messages = [
            {
                "role": "system",
                "content": "Summarize clearly, simply, and concisely. Make it easy for dyslexic readers."
            },
            {
                "role": "user",
                "content": text
            }
        ]
        
        # Generate summary
        output = text_gen_pipeline(
            messages,
            max_new_tokens=500,
            temperature=0.7,
            do_sample=True,
            top_p=0.9
        )
        
        # Extract the assistant's response
        summary = ""
        if output and len(output) > 0:
            generated_text = output[0].get('generated_text', [])
            # Find the assistant's response (last message)
            for msg in reversed(generated_text):
                if msg.get('role') == 'assistant':
                    summary = msg.get('content', '')
                    break
        
        if not summary:
            return jsonify({"error": "Failed to generate summary"}), 500
        
        print(f"Summary generated (length: {len(summary)} chars)")
        
        return jsonify({"summary": summary})
    
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
    Expects JSON: {"messages": [{"role": "user", "content": "..."}]}
    Returns: JSON with response
    """
    try:
        data = request.get_json()
        if not data or 'messages' not in data:
            return jsonify({"error": "No messages provided"}), 400
        
        messages = data['messages']
        max_tokens = data.get('max_tokens', 500)
        temperature = data.get('temperature', 0.7)
        
        print(f"Generating response for {len(messages)} messages...")
        
        # Generate response
        output = text_gen_pipeline(
            messages,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=True,
            top_p=0.9
        )
        
        # Extract the assistant's response
        response = ""
        if output and len(output) > 0:
            generated_text = output[0].get('generated_text', [])
            for msg in reversed(generated_text):
                if msg.get('role') == 'assistant':
                    response = msg.get('content', '')
                    break
        
        return jsonify({"response": response})
    
    except Exception as err:
        print(f"CHAT ERROR: {err}")
        return jsonify({
            "error": "Chat generation failed",
            "details": str(err)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)