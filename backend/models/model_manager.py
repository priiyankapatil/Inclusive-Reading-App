"""
Model Manager - Handles downloading and managing ML models
"""

import os
from huggingface_hub import snapshot_download, HfApi
from tqdm import tqdm


class ModelManager:
    """Manages downloading and tracking of ML models"""
    
    @staticmethod
    def download_model(model_name, model_dir, verbose=True):
        """
        Download a model from Hugging Face Hub
        
        Args:
            model_name (str): Name of the model on Hugging Face Hub
            model_dir (str): Local directory to save the model
            verbose (bool): Whether to show detailed download information
            
        Returns:
            bool: True if download successful, False otherwise
        """
        if verbose:
            print("=" * 60)
            print(f"Starting model download...")
            print(f"Model: {model_name}")
            print(f"Destination: {model_dir}")
            print("=" * 60)
        
        try:
            if verbose:
                # Get file list to show what will be downloaded
                api = HfApi()
                print("\nFetching model information...")
                model_info = api.model_info(model_name)
                
                # List files that will be downloaded
                print(f"\nModel contains {len(model_info.siblings)} files")
                print("\nFiles to download:")
                for sibling in model_info.siblings[:10]:  # Show first 10 files
                    print(f"  - {sibling.rfilename}")
                if len(model_info.siblings) > 10:
                    print(f"  ... and {len(model_info.siblings) - 10} more files")
                
                print("\nDownloading model files...")
            
            snapshot_download(
                repo_id=model_name,
                local_dir=model_dir,
                local_dir_use_symlinks=False,
                resume_download=True,
                tqdm_class=tqdm if verbose else None,
                ignore_patterns=["*.md", "*.txt"] if not verbose else None
            )
            
            if verbose:
                print("\n" + "=" * 60)
                print("✓ Model downloaded successfully!")
                print(f"✓ Model saved to: {os.path.abspath(model_dir)}")
                print("=" * 60 + "\n")
            
            return True
            
        except Exception as e:
            if verbose:
                print("\n" + "=" * 60)
                print(f"✗ Error downloading model: {e}")
                print("=" * 60 + "\n")
            return False
    
    @staticmethod
    def model_exists(model_dir):
        """
        Check if a model exists locally
        
        Args:
            model_dir (str): Path to model directory
            
        Returns:
            bool: True if model exists, False otherwise
        """
        return os.path.exists(model_dir) and os.path.isdir(model_dir)
