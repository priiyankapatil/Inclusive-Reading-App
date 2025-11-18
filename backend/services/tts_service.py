"""
TTS Service - Handles text-to-speech synthesis using Maya1 model
"""

import torch
import io
import numpy as np
import scipy.io.wavfile as wavfile
from transformers import pipeline
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.model_manager import ModelManager


class TTSService:
    """Service for text-to-speech synthesis"""
    
    MODEL_NAME = "maya-research/maya1"
    MODEL_DIR = "./maya1_model"
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.pipeline = None
        
    def initialize(self):
        """Initialize and load the TTS model"""
        if self.pipeline is not None:
            print("TTS model already loaded")
            return True
        
        # TEMPORARILY COMMENTED OUT - Maya model downloading disabled
        # # Check if model exists, download if not
        # if not ModelManager.model_exists(self.MODEL_DIR):
        #     print("TTS model not found locally. Downloading...")
        #     if not ModelManager.download_model(self.MODEL_NAME, self.MODEL_DIR, verbose=False):
        #         raise Exception("Failed to download TTS model")
        
        # print(f"Loading TTS model from {self.MODEL_DIR} on {self.device}...")
        # try:
        #     self.pipeline = pipeline(
        #         "text-to-speech",
        #         model=self.MODEL_DIR,
        #         device=0 if self.device == "cuda" else -1
        #     )
        #     print("TTS model loaded successfully!")
        #     return True
        # except Exception as e:
        #     print(f"Error loading TTS model: {e}")
        #     raise
        
        print("TTS service initialization skipped (model downloading disabled)")
        return False
    
    def synthesize(self, text):
        """
        Synthesize speech from text
        
        Args:
            text (str): Text to convert to speech
            
        Returns:
            tuple: (audio_buffer, sampling_rate) - BytesIO buffer containing WAV audio and sampling rate
            
        Raises:
            ValueError: If text is empty
            Exception: If synthesis fails
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        if self.pipeline is None:
            raise Exception("Model not initialized. Call initialize() first.")
        
        print(f"Synthesizing: {text[:50]}...")
        
        # Generate speech
        output = self.pipeline(text)
        
        # Validate output
        if output is None:
            raise Exception("TTS pipeline returned None - model may not be properly initialized")
        
        if not isinstance(output, dict) or 'audio' not in output:
            raise Exception(f"Unexpected output format from TTS pipeline: {type(output)}")
        
        # Extract audio data
        audio_data = output.get('audio')
        sampling_rate = output.get('sampling_rate', 22050)  # Default sampling rate
        
        # Validate audio data
        if audio_data is None:
            raise Exception("TTS pipeline returned None for audio data")
        
        # Convert to numpy array if it's a tensor
        if torch.is_tensor(audio_data):
            audio_data = audio_data.cpu().numpy()
        
        # Additional validation
        if not isinstance(audio_data, np.ndarray):
            raise Exception(f"Audio data is not a valid array type: {type(audio_data)}")
        
        if audio_data.size == 0:
            raise Exception("Audio data is empty")
        
        # Ensure audio is in correct format (int16)
        if audio_data.dtype != np.int16:
            # Normalize to [-1, 1] range if needed
            if np.abs(audio_data).max() > 1.0:
                audio_data = audio_data / np.abs(audio_data).max()
            audio_data = (audio_data * 32767).astype(np.int16)
        
        # Create WAV file in memory
        audio_buffer = io.BytesIO()
        wavfile.write(audio_buffer, sampling_rate, audio_data)
        audio_buffer.seek(0)
        
        print(f"Synthesis complete, audio length: {len(audio_data)} samples")
        return audio_buffer, sampling_rate
    
    def synthesize_base64(self, text):
        """
        Synthesize speech and return as base64 encoded string
        
        Args:
            text (str): Text to convert to speech
            
        Returns:
            dict: Dictionary with 'audio' (base64), 'sampling_rate', and 'format'
        """
        import base64
        
        audio_buffer, sampling_rate = self.synthesize(text)
        
        # Encode to base64
        audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
        
        return {
            "audio": audio_base64,
            "sampling_rate": int(sampling_rate),
            "format": "wav"
        }
    
    def is_initialized(self):
        """Check if the model is initialized"""
        return self.pipeline is not None
    
    def get_device(self):
        """Get the device being used"""
        return self.device
