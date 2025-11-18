"""
OCR Service using OCR.space API
Extracts text from images using the OCR.space service
"""

import requests
import os
import base64
from io import BytesIO


class OCRService:
    """Service for performing OCR on images using OCR.space API"""
    
    def __init__(self):
        self.api_url = "https://api.ocr.space/parse/image"
        self.api_key = os.environ.get('OCR_API_KEY', '')
        
    def is_initialized(self):
        """Check if API key is configured"""
        return bool(self.api_key)
    
    def extract_text_from_base64(self, base64_image, language='eng', overlay=False):
        """
        Extract text from a base64 encoded image
        
        Args:
            base64_image: Base64 encoded image string (with or without data URI prefix)
            language: OCR language (default: 'eng')
            overlay: Whether to get overlay information (default: False)
        
        Returns:
            str: Extracted text from the image
        
        Raises:
            ValueError: If API key is not configured or OCR fails
        """
        if not self.is_initialized():
            raise ValueError("OCR API key not configured. Please set OCR_API_KEY environment variable.")
        
        try:
            # Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
            if 'base64,' in base64_image:
                base64_image = base64_image.split('base64,')[1]
            
            # Prepare the payload
            payload = {
                'isOverlayRequired': overlay,
                'apikey': self.api_key,
                'language': language,
                'base64Image': f'data:image/jpeg;base64,{base64_image}'
            }
            
            # Make the request
            response = requests.post(self.api_url, data=payload)
            response.raise_for_status()
            
            # Parse the response
            result = response.json()
            
            # Check if OCR was successful
            if result.get('IsErroredOnProcessing'):
                error_message = result.get('ErrorMessage', ['Unknown error'])
                raise ValueError(f"OCR processing error: {error_message}")
            
            # Extract text from all parsed results
            parsed_results = result.get('ParsedResults', [])
            if not parsed_results:
                return ""
            
            # Combine text from all parsed results
            extracted_text = ""
            for parsed_result in parsed_results:
                text = parsed_result.get('ParsedText', '')
                if text:
                    extracted_text += text + "\n"
            
            return extracted_text.strip()
        
        except requests.exceptions.RequestException as e:
            raise ValueError(f"OCR API request failed: {str(e)}")
        except Exception as e:
            raise ValueError(f"OCR processing failed: {str(e)}")
    
    def extract_text_from_file(self, file_path, language='eng', overlay=False):
        """
        Extract text from an image file
        
        Args:
            file_path: Path to the image file
            language: OCR language (default: 'eng')
            overlay: Whether to get overlay information (default: False)
        
        Returns:
            str: Extracted text from the image
        
        Raises:
            ValueError: If API key is not configured or OCR fails
        """
        if not self.is_initialized():
            raise ValueError("OCR API key not configured. Please set OCR_API_KEY environment variable.")
        
        try:
            # Prepare the payload with file
            with open(file_path, 'rb') as f:
                payload = {
                    'isOverlayRequired': overlay,
                    'apikey': self.api_key,
                    'language': language,
                }
                files = {'filename': f}
                
                # Make the request
                response = requests.post(self.api_url, data=payload, files=files)
                response.raise_for_status()
            
            # Parse the response
            result = response.json()
            
            # Check if OCR was successful
            if result.get('IsErroredOnProcessing'):
                error_message = result.get('ErrorMessage', ['Unknown error'])
                raise ValueError(f"OCR processing error: {error_message}")
            
            # Extract text from all parsed results
            parsed_results = result.get('ParsedResults', [])
            if not parsed_results:
                return ""
            
            # Combine text from all parsed results
            extracted_text = ""
            for parsed_result in parsed_results:
                text = parsed_result.get('ParsedText', '')
                if text:
                    extracted_text += text + "\n"
            
            return extracted_text.strip()
        
        except requests.exceptions.RequestException as e:
            raise ValueError(f"OCR API request failed: {str(e)}")
        except FileNotFoundError:
            raise ValueError(f"Image file not found: {file_path}")
        except Exception as e:
            raise ValueError(f"OCR processing failed: {str(e)}")
