import { useCallback, useRef, useState } from 'react';

const SpeechRecognitionImpl = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export function useVoiceInput(langCode) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const supported = !!SpeechRecognitionImpl;

  const start = useCallback((onResult, onError) => {
    if (!SpeechRecognitionImpl) {
      onError?.('unsupported');
      return;
    }
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = langCode === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };
    recognition.onerror = (event) => onError?.(event.error);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [langCode]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, start, stop };
}
