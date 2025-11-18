"""
Translation Service - Handles text translation using deep-translator library
"""

from deep_translator import GoogleTranslator
from langdetect import detect, DetectorFactory

# Make language detection deterministic
DetectorFactory.seed = 0


class TranslationService:
    """Service for text translation"""
    
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
    
    def __init__(self):
        self.initialized = False
        
    def initialize(self):
        """Initialize the translator"""
        if self.initialized:
            print("Translation service already initialized")
            return True
            
        try:
            print("Initializing translation service...")
            # deep-translator doesn't need explicit initialization
            # Just verify it's available
            self.initialized = True
            print("Translation service initialized successfully!")
            return True
        except Exception as e:
            print(f"Error initializing translation service: {e}")
            raise
    
    def translate(self, text, target_language):
        """
        Translate the given text to target language
        
        Args:
            text (str): Text to translate
            target_language (str): Target language name (e.g., "Hindi", "French")
            
        Returns:
            dict: Dictionary with translated text and detected source language
            
        Raises:
            ValueError: If text is empty or language not supported
            Exception: If translation fails
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        if not self.initialized:
            raise Exception("Translation service not initialized. Call initialize() first.")
        
        # Get language code
        target_code = self.LANGUAGE_MAP.get(target_language)
        if not target_code:
            raise ValueError(f"Unsupported language: {target_language}")
        
        print(f"Translating text to {target_language} ({target_code})...")
        print(f"Text length: {len(text)} chars")
        
        try:
            # Detect source language
            try:
                source_lang = detect(text)
            except:
                source_lang = "auto"
            
            # Perform translation using deep-translator
            translator = GoogleTranslator(source='auto', target=target_code)
            translated_text = translator.translate(text)
            
            print(f"Translation successful! Detected source language: {source_lang}")
            print(f"Translated text length: {len(translated_text)} chars")
            
            return {
                "translated": translated_text,
                "source_language": source_lang,
                "target_language": target_language,
                "target_code": target_code
            }
            
        except Exception as e:
            print(f"Translation error: {e}")
            raise Exception(f"Translation failed: {str(e)}")
    
    def detect_language(self, text):
        """
        Detect the language of the given text
        
        Args:
            text (str): Text to detect language from
            
        Returns:
            dict: Dictionary with detected language code and confidence
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        if not self.initialized:
            raise Exception("Translation service not initialized. Call initialize() first.")
        
        try:
            language = detect(text)
            return {
                "language": language,
                "confidence": 1.0  # langdetect doesn't provide confidence scores
            }
        except Exception as e:
            print(f"Language detection error: {e}")
            raise Exception(f"Language detection failed: {str(e)}")
    
    def is_initialized(self):
        """Check if the service is initialized"""
        return self.initialized
    
    @staticmethod
    def get_supported_languages():
        """Get list of supported languages"""
        return list(TranslationService.LANGUAGE_MAP.keys())
