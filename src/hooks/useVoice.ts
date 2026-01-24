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
  const isRecognitionActiveRef = useRef(false);
  const isWakeWordModeRef = useRef(false);
  const wakeWordInitializedRef = useRef(false);
  const MAX_RETRIES = 3;

  // Store callbacks in refs to avoid dependency issues
  const onTranscriptRef = useRef(onTranscript);
  const onWakeWordRef = useRef(onWakeWord);
  onTranscriptRef.current = onTranscript;
  onWakeWordRef.current = onWakeWord;

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

      // Check for wake word using ref to avoid stale closure
      if (isWakeWordModeRef.current) {
        const lowerTranscript = currentTranscript.toLowerCase();
        if (
          lowerTranscript.includes("enma") ||
          lowerTranscript.includes("hey enma") ||
          lowerTranscript.includes("hi enma")
        ) {
          onWakeWordRef.current?.();
          setIsWakeWordMode(false);
          isWakeWordModeRef.current = false;
          setTranscript("");
        }
      } else if (finalTranscript) {
        onTranscriptRef.current?.(finalTranscript.trim());
        setTranscript("");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "not-allowed") {
        setHasPermission(false);
        setIsListening(false);
        shouldBeListeningRef.current = false;
        isRecognitionActiveRef.current = false;
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
      isRecognitionActiveRef.current = false;
    };

    recognition.onend = () => {
      isRecognitionActiveRef.current = false;
      
      // Restart if still supposed to be listening
      if (shouldBeListeningRef.current) {
        try {
          recognition.start();
          isRecognitionActiveRef.current = true;
          setIsListening(true);
          return;
        } catch {
          // ignore
        }
      }

      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [SpeechRecognitionAPI]);

  // Start listening
  const startListening = useCallback(async () => {
    // Guard: don't start if already active using ref (not state)
    if (isRecognitionActiveRef.current || shouldBeListeningRef.current) {
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
        isRecognitionActiveRef.current = true;
        setIsListening(true);
        setTranscript("");
      } catch (error) {
        // Handle "already started" error gracefully
        if (error instanceof DOMException && error.name === 'InvalidStateError') {
          console.log('Recognition already started, ignoring');
          isRecognitionActiveRef.current = true;
          setIsListening(true);
        } else {
          console.error("Failed to start recognition:", error);
          toast.error("Failed to start voice recognition.");
          shouldBeListeningRef.current = false;
          isRecognitionActiveRef.current = false;
        }
      }
    }
  }, [isSupported, hasPermission, requestPermission, initRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    isRecognitionActiveRef.current = false;
    
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

  // Toggle listening - use ref to check state
  const toggleListening = useCallback(() => {
    if (isRecognitionActiveRef.current) {
      stopListening();
    } else {
      void startListening();
    }
  }, [startListening, stopListening]);

  // Start wake word detection
  const startWakeWordDetection = useCallback(async () => {
    // Guard: don't start if already active
    if (isRecognitionActiveRef.current || shouldBeListeningRef.current) {
      console.log('Already listening for wake word, skipping start');
      return;
    }
    
    if (!isSupported) return;

    setIsWakeWordMode(true);
    isWakeWordModeRef.current = true;
    await startListening();
  }, [isSupported, startListening]);

  // Stop wake word detection
  const stopWakeWordDetection = useCallback(() => {
    setIsWakeWordMode(false);
    isWakeWordModeRef.current = false;
    wakeWordInitializedRef.current = false;
    stopListening();
  }, [stopListening]);

  // Speak text using browser's built-in Speech Synthesis API
  // Improved chunking and voice selection for more natural, less stuttering speech
  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !text.trim() || !isTTSSupported) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      setIsSpeaking(true);

      // Improved chunking - split at natural pauses for smoother speech
      const chunkText = (text: string, maxLength = 100): string[] => {
        const chunks: string[] = [];
        
        // Clean text for better TTS
        const cleanText = text
          .replace(/\n+/g, '. ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Split by sentences first
        const sentences = cleanText.split(/(?<=[.!?])\s+/);
        let currentChunk = "";

        for (const sentence of sentences) {
          if ((currentChunk + " " + sentence).length > maxLength && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk = currentChunk ? currentChunk + " " + sentence : sentence;
          }
        }
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        return chunks.length > 0 ? chunks : [text];
      };

      const chunks = chunkText(text);
      let currentIndex = 0;

      const speakChunk = () => {
        if (currentIndex >= chunks.length) {
          setIsSpeaking(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);

        // Find a high-quality voice with improved selection
        const getPreferredVoice = () => {
          if (preferredVoice && availableVoices.length > 0) {
            const found = availableVoices.find(v => v.name === preferredVoice);
            if (found) return found;
          }
          
          // Priority order for natural-sounding voices
          const qualityKeywords = ['neural', 'natural', 'premium', 'enhanced', 'wavenet'];
          
          // Try each quality level
          for (const keyword of qualityKeywords) {
            const voice = availableVoices.find(v => 
              v.name.toLowerCase().includes(keyword)
            );
            if (voice) return voice;
          }

          // Prefer Google voices as they tend to be higher quality
          const googleVoice = availableVoices.find(v => 
            v.name.toLowerCase().includes('google')
          );
          if (googleVoice) return googleVoice;

          // Then Microsoft
          const msVoice = availableVoices.find(v => 
            v.name.toLowerCase().includes('microsoft')
          );
          if (msVoice) return msVoice;

          return availableVoices[0] || null;
        };

        const selectedVoice = getPreferredVoice();
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        // Optimized speech settings for less stuttering
        utterance.rate = 0.88; // Slightly slower reduces stuttering
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
          currentIndex++;
          // Natural pause between chunks
          if (currentIndex < chunks.length) {
            setTimeout(speakChunk, 80);
          } else {
            setIsSpeaking(false);
          }
        };

        utterance.onerror = (event) => {
          // Only log actual errors, not interruptions
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            console.error("Speech synthesis error:", event.error);
          }
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      };

      speakChunk();
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
