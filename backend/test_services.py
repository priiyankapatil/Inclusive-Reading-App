"""
Test script for backend services
Run this to test the services independently without starting the Flask server
"""

def test_summarization_service():
    """Test the summarization service"""
    print("\n" + "="*60)
    print("Testing Summarization Service")
    print("="*60)
    
    try:
        from services.summarization_service import SummarizationService
        
        service = SummarizationService()
        print(f"✓ Service created")
        print(f"  Device: {service.get_device()}")
        
        print("\nInitializing model...")
        service.initialize()
        print(f"✓ Model initialized: {service.is_initialized()}")
        
        print("\nTesting summarization...")
        test_text = """
        Artificial intelligence (AI) is intelligence demonstrated by machines, 
        as opposed to the natural intelligence displayed by humans and animals. 
        Leading AI textbooks define the field as the study of "intelligent agents": 
        any device that perceives its environment and takes actions that maximize 
        its chance of successfully achieving its goals.
        """
        
        summary = service.summarize(test_text)
        print(f"✓ Summary generated:")
        print(f"  Input length: {len(test_text)} chars")
        print(f"  Output length: {len(summary)} chars")
        print(f"\n  Summary: {summary}\n")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_tts_service():
    """Test the TTS service"""
    print("\n" + "="*60)
    print("Testing TTS Service")
    print("="*60)
    
    try:
        from services.tts_service import TTSService
        
        service = TTSService()
        print(f"✓ Service created")
        print(f"  Device: {service.get_device()}")
        
        print("\nInitializing model...")
        service.initialize()
        print(f"✓ Model initialized: {service.is_initialized()}")
        
        print("\nTesting speech synthesis...")
        test_text = "Hello, this is a test of the text to speech system."
        
        audio_buffer, sampling_rate = service.synthesize(test_text)
        print(f"✓ Audio generated:")
        print(f"  Sampling rate: {sampling_rate} Hz")
        print(f"  Buffer size: {audio_buffer.getbuffer().nbytes} bytes")
        
        # Save to file for testing
        with open("test_output.wav", "wb") as f:
            audio_buffer.seek(0)
            f.write(audio_buffer.read())
        print(f"  ✓ Audio saved to test_output.wav\n")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_model_manager():
    """Test the model manager"""
    print("\n" + "="*60)
    print("Testing Model Manager")
    print("="*60)
    
    try:
        from models.model_manager import ModelManager
        
        # Check if models exist
        sum_exists = ModelManager.model_exists("./hermes3_model")
        tts_exists = ModelManager.model_exists("./maya1_model")
        
        print(f"✓ Model Manager imported")
        print(f"  Summarization model exists: {sum_exists}")
        print(f"  TTS model exists: {tts_exists}\n")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n" + "="*60)
    print("BACKEND SERVICE TESTS")
    print("="*60)
    
    results = {
        "Model Manager": test_model_manager(),
        "Summarization Service": test_summarization_service(),
        "TTS Service": test_tts_service()
    }
    
    print("\n" + "="*60)
    print("TEST RESULTS")
    print("="*60)
    
    for name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{name}: {status}")
    
    all_passed = all(results.values())
    print("\n" + "="*60)
    if all_passed:
        print("✓ ALL TESTS PASSED")
    else:
        print("✗ SOME TESTS FAILED")
    print("="*60 + "\n")
