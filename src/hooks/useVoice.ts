import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  onWakeWord?: () => void;
  wakeWordEnabled?: boolean;
  voiceEnabled?: boolean;
  preferredVoice?: string;
}

export const useVoice = (options: UseVoiceOptions = {}) => {
  const {
    onTranscript,
    onWakeWord,
    wakeWordEnabled = false,
    voiceEnabled = true,
    preferredVoice = "",
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWakeWordMode, setIsWakeWordMode] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldBeListeningRef = useRef(false);
  const MAX_RETRIES = 3;

  // Check for Speech Recognition support
  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognitionAPI;
  const isTTSSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Load available browser voices
  useEffect(() => {
    if (!isTTSSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isTTSSupported]);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      setHasPermission(false);
      return false;
    }
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI || recognitionRef.current) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // If we got results, the session is alive; reset retry counter
      retryCountRef.current = 0;

      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      // Check for wake word
      if (isWakeWordMode) {
        const lowerTranscript = currentTranscript.toLowerCase();
        if (
          lowerTranscript.includes("enma") ||
          lowerTranscript.includes("hey enma") ||
          lowerTranscript.includes("hi enma")
        ) {
          onWakeWord?.();
          setIsWakeWordMode(false);
          setTranscript("");
        }
      } else if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript.trim());
        setTranscript("");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "not-allowed") {
        setHasPermission(false);
        setIsListening(false);
        shouldBeListeningRef.current = false;
        toast.error("Microphone access denied. Please allow microphone access.");
        return;
      }

      // Retry on network errors with exponential backoff
      if (event.error === "network" && shouldBeListeningRef.current) {
        if (retryCountRef.current < MAX_RETRIES) {
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          retryCountRef.current++;

          console.log(
            `Retrying speech recognition in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`
          );

          // Abort current session before restarting
          try {
            recognition.abort();
          } catch {
            // ignore
          }

          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }

          retryTimeoutRef.current = setTimeout(() => {
            if (!recognitionRef.current || !shouldBeListeningRef.current) return;
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch {
              // ignore
            }
          }, delay);
          return;
        }

        toast.error(
          "Voice input is unavailable in this browser/network. Try Chrome or a different connection."
        );
      }

      setIsListening(false);
      shouldBeListeningRef.current = false;
    };

    recognition.onend = () => {
      // Restart if in wake word mode or still supposed to be listening
      if (shouldBeListeningRef.current) {
        try {
          recognition.start();
          setIsListening(true);
          return;
        } catch {
          // ignore
        }
      }

      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [SpeechRecognitionAPI, isWakeWordMode, wakeWordEnabled, onTranscript, onWakeWord]);

  // Start listening
  const startListening = useCallback(async () => {
    // Guard: don't start if already listening
    if (isListening || shouldBeListeningRef.current) {
      console.log('Already listening, skipping start');
      return;
    }
    
    if (!isSupported) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    const hasPermissionNow = hasPermission ?? (await requestPermission());
    if (!hasPermissionNow) return;

    // Reset retry count & set desired listening state
    retryCountRef.current = 0;
    shouldBeListeningRef.current = true;

    initRecognition();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript("");
      } catch (error) {
        // Handle "already started" error gracefully
        if (error instanceof DOMException && error.name === 'InvalidStateError') {
          console.log('Recognition already started, ignoring');
          setIsListening(true);
        } else {
          console.error("Failed to start recognition:", error);
          toast.error("Failed to start voice recognition.");
          shouldBeListeningRef.current = false;
        }
      }
    }
  }, [isSupported, isListening, hasPermission, requestPermission, initRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.warn('Error stopping recognition:', error);
      }
    }
    
    setIsListening(false);
    setTranscript('');
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Start wake word detection
  const startWakeWordDetection = useCallback(async () => {
    // Guard: don't start if already listening
    if (isListening || shouldBeListeningRef.current) {
      console.log('Already listening for wake word, skipping start');
      return;
    }
    
    if (!wakeWordEnabled || !isSupported) return;

    setIsWakeWordMode(true);
    await startListening();
  }, [wakeWordEnabled, isSupported, isListening, startListening]);

  // Stop wake word detection
  const stopWakeWordDetection = useCallback(() => {
    setIsWakeWordMode(false);
    stopListening();
  }, [stopListening]);

  // Speak text using browser's built-in Speech Synthesis API (FREE)
  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !text.trim() || !isTTSSupported) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Find the preferred voice or use default
      if (preferredVoice && availableVoices.length > 0) {
        const voice = availableVoices.find(v => v.name === preferredVoice);
        if (voice) {
          utterance.voice = voice;
        }
      } else if (availableVoices.length > 0) {
        // Use first available English voice as default
        utterance.voice = availableVoices[0];
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, preferredVoice, availableVoices, isTTSSupported]
  );

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (isTTSSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [isTTSSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (isTTSSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isTTSSupported]);

  return {
    isListening,
    isSpeaking,
    isWakeWordMode,
    transcript,
    hasPermission,
    isSupported,
    isTTSSupported,
    availableVoices,
    startListening,
    stopListening,
    toggleListening,
    startWakeWordDetection,
    stopWakeWordDetection,
    speak,
    stopSpeaking,
    requestPermission,
  };
};
