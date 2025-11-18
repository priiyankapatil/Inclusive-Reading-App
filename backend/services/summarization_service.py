"""
Summarization Service - Handles text summarization using Groq API
"""

import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get GROQ API KEY from environment variable
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set. Please add it to your .env file.")


class SummarizationService:
    """Service for text summarization using Groq"""
    
    MODEL_NAME = "llama-3.1-8b-instant"
    
    def __init__(self):
        self.client = None
        self.initialized = False
        
    def initialize(self):
        """Initialize the Groq client"""
        if self.initialized:
            print("Groq client already initialized")
            return True
        
        print("Initializing Groq client for summarization...")
        try:
            self.client = Groq(api_key=GROQ_API_KEY)
            self.initialized = True
            print("Groq client initialized successfully!")
            return True
        except Exception as e:
            print(f"Error initializing Groq client: {e}")
            raise
    
    def summarize(self, text):
        """
        Summarize the given text
        
        Args:
            text (str): Text to summarize
            
        Returns:
            str: Summarized text
            
        Raises:
            ValueError: If text is empty
            Exception: If summarization fails
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        if not self.initialized or self.client is None:
            raise Exception("Groq client not initialized. Call initialize() first.")
        
        print(f"Summarizing text (length: {len(text)} chars)...")
        
        try:
            # Create completion with Groq
            completion = self.client.chat.completions.create(
                model=self.MODEL_NAME,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that summarizes text clearly, simply, and concisely. Make summaries easy to understand for dyslexic readers."
                    },
                    {
                        "role": "user",
                        "content": f"Please summarize the following text:\n\n{text}"
                    }
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            # Extract the summary
            summary = completion.choices[0].message.content
            
            if not summary:
                raise Exception("Failed to generate summary")
            
            print(f"Summary generated (length: {len(summary)} chars)")
            return summary
            
        except Exception as e:
            print(f"Error during summarization: {e}")
            raise Exception(f"Summarization failed: {str(e)}")
    
    def chat(self, messages, max_tokens=500, temperature=0.7):
        """
        General chat/text generation
        
        Args:
            messages (list): List of message dictionaries with 'role' and 'content'
            max_tokens (int): Maximum tokens to generate
            temperature (float): Sampling temperature
            
        Returns:
            str: Generated response
        """
        if not self.initialized or self.client is None:
            raise Exception("Groq client not initialized. Call initialize() first.")
        
        print(f"Generating response for {len(messages)} messages...")
        
        try:
            # Generate response using Groq
            completion = self.client.chat.completions.create(
                model=self.MODEL_NAME,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            # Extract the response
            response = completion.choices[0].message.content
            
            return response
            
        except Exception as e:
            print(f"Error during chat generation: {e}")
            raise Exception(f"Chat generation failed: {str(e)}")
    
    def is_initialized(self):
        """Check if the client is initialized"""
        return self.initialized
    
    def get_device(self):
        """Get the device being used (API-based, so returns 'groq-api')"""
        return "groq-api"
