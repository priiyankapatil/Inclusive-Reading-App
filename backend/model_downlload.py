"""
Hermes-3-Llama-3.2-3B Model Download Script
Downloads and tests the model locally with progress logging.

Installation:
pip install transformers torch huggingface_hub tqdm accelerate
"""

from transformers import pipeline
from huggingface_hub import snapshot_download, HfApi
from tqdm import tqdm
import os
import torch

# Configuration
MODEL_NAME = "NousResearch/Hermes-3-Llama-3.2-3B"
MODEL_DIR = "./hermes3_model"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def download_model():
    """Download the model files to local directory with progress tracking"""
    print("="*70)
    print(f"Starting model download...")
    print(f"Model: {MODEL_NAME}")
    print(f"Destination: {MODEL_DIR}")
    print(f"Device: {DEVICE}")
    print("="*70)
    
    try:
        # Get file list to show what will be downloaded
        api = HfApi()
        print("\nFetching model information...")
        model_info = api.model_info(MODEL_NAME)
        
        # List files that will be downloaded
        print(f"\nModel contains {len(model_info.siblings)} files")
        print("\nFiles to download:")
        for sibling in model_info.siblings[:15]:  # Show first 15 files
            print(f"  - {sibling.rfilename}")
        if len(model_info.siblings) > 15:
            print(f"  ... and {len(model_info.siblings) - 15} more files")
        
        print("\n" + "="*70)
        print("Downloading model files (this may take several minutes)...")
        print("="*70 + "\n")
        
        snapshot_download(
            repo_id=MODEL_NAME,
            local_dir=MODEL_DIR,
            local_dir_use_symlinks=False,
            resume_download=True,
            tqdm_class=tqdm
        )
        
        print("\n" + "="*70)
        print("✓ Model downloaded successfully!")
        print(f"✓ Model saved to: {os.path.abspath(MODEL_DIR)}")
        print("="*70 + "\n")
        return True
        
    except Exception as e:
        print("\n" + "="*70)
        print(f"✗ Error downloading model: {e}")
        print("="*70 + "\n")
        return False

def test_model():
    """Test the downloaded model with a sample conversation"""
    print("="*70)
    print("Loading model for testing...")
    print("="*70 + "\n")
    
    try:
        # Load pipeline from local directory
        pipe = pipeline(
            "text-generation",
            model=MODEL_DIR,
            device=0 if DEVICE == "cuda" else -1
        )
        
        print("✓ Model loaded successfully!\n")
        print("="*70)
        print("Running test inference...")
        print("="*70 + "\n")
        
        # Test messages
        messages = [
            {"role": "user", "content": "Who are you?"},
        ]
        
        print("Input:")
        print(f"  User: {messages[0]['content']}\n")
        
        # Generate response
        output = pipe(messages, max_new_tokens=100)
        
        print("Output:")
        print(f"  {output[0]['generated_text'][-1]['content']}\n")
        
        print("="*70)
        print("✓ Test completed successfully!")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"✗ Error during testing: {e}\n")

def main():
    """Main function to download and test the model"""
    print("\n" + "="*70)
    print("HERMES-3 LLAMA 3.2 3B - DOWNLOAD & TEST SCRIPT")
    print("="*70 + "\n")
    
    # Check if model already exists
    if os.path.exists(MODEL_DIR):
        print(f"Model directory already exists at: {MODEL_DIR}")
        response = input("Do you want to re-download? (y/n): ").lower()
        if response != 'y':
            print("\nSkipping download. Testing existing model...\n")
            test_model()
            return
    
    # Download the model
    if download_model():
        # Test the model
        test_model()
    else:
        print("Download failed. Please check your internet connection and try again.")

if __name__ == "__main__":
    main()