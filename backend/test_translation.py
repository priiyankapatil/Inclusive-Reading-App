"""
Test script for translation service
"""
from services.translation_service import TranslationService

def test_translation():
    print("=" * 50)
    print("Testing Translation Service")
    print("=" * 50)
    
    # Initialize service
    service = TranslationService()
    service.initialize()
    
    # Test text
    test_text = "Hello, how are you today?"
    
    # Test translation to different languages
    languages = ["Hindi", "French", "Spanish"]
    
    for lang in languages:
        print(f"\n{'='*50}")
        print(f"Testing translation to {lang}")
        print(f"Original: {test_text}")
        
        try:
            result = service.translate(test_text, lang)
            print(f"Translated: {result['translated']}")
            print(f"Source language detected: {result['source_language']}")
            print(f"Target code: {result['target_code']}")
            print("✓ Success!")
        except Exception as e:
            print(f"✗ Error: {e}")
    
    # Test language detection
    print(f"\n{'='*50}")
    print("Testing language detection")
    
    test_texts = [
        "Hello World",
        "Bonjour le monde",
        "नमस्ते दुनिया"
    ]
    
    for text in test_texts:
        try:
            result = service.detect_language(text)
            print(f"Text: {text}")
            print(f"Detected: {result['language']} (confidence: {result['confidence']})")
        except Exception as e:
            print(f"Error: {e}")
    
    print(f"\n{'='*50}")
    print("All tests completed!")
    print(f"{'='*50}")

if __name__ == "__main__":
    test_translation()
