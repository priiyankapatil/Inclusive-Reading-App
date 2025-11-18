import { useState, useCallback, useEffect } from "react";

export function useTTS() {
  const [isReading, setIsReading] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setCurrentWordIndex(-1);
  }, []);

  const speak = useCallback((text, rate = 1.0) => {
    stop();
    if (!text.trim()) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  }, [stop]);

  const speakWithHighlight = useCallback((text, rate = 1.0) => {
    stop();
    if (!text.trim()) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    
    utterance.onboundary = (e) => {
      const idx = text.slice(0, e.charIndex).trim().split(/\s+/).length - 1;
      setCurrentWordIndex(idx);
    };
    
    utterance.onstart = () => {
      setIsReading(true);
      setCurrentWordIndex(-1);
    };
    
    utterance.onend = () => {
      setIsReading(false);
      setCurrentWordIndex(-1);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [stop]);

  return {
    isReading,
    currentWordIndex,
    speak,
    speakWithHighlight,
    stop,
  };
}
