import { useState, useCallback, useRef, useEffect } from "react";
import { useScribe, CommitStrategy } from "@elevenlabs/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseElevenLabsVoiceOptions {
  onTranscript?: (text: string) => void;
  voiceEnabled?: boolean;
  preferredVoice?: string;
}

export const useElevenLabsVoice = (options: UseElevenLabsVoiceOptions = {}) => {
  const {
    onTranscript,
    voiceEnabled = true,
    preferredVoice = "",
  } = options;

  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  
  const isTTSSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // ElevenLabs Scribe hook for realtime transcription
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    // Voice Activity Detection - auto-commits on silence
    // Tuned to commit more reliably across noisier mics.
    commitStrategy: CommitStrategy.VAD,
    vadSilenceThresholdSecs: 0.8,
    vadThreshold: 0.35,
    minSpeechDurationMs: 150,
    minSilenceDurationMs: 250,
    onError: (error) => {
      console.error("ElevenLabs Scribe error:", error);
      toast.error("Voice input error. Please try again.");
    },
    onAuthError: (data) => {
      console.error("ElevenLabs Scribe auth error:", data?.error);
      toast.error("Voice auth error. Please try again.");
    },
    onQuotaExceededError: (data) => {
      console.error("ElevenLabs Scribe quota exceeded:", data?.error);
      toast.error("Voice quota exceeded. Please try again later.");
    },
    onInsufficientAudioActivityError: (data) => {
      console.warn("ElevenLabs Scribe insufficient audio activity:", data?.error);
      toast.error("No audio detected. Check your microphone and try again.");
    },
    onCommittedTranscript: (data) => {
      if (data.text?.trim()) {
        onTranscriptRef.current?.(data.text.trim());
      }
    },
  });

  const isListening = scribe.isConnected;
  const transcript = scribe.partialTranscript || "";

  // Load available browser voices for TTS
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
      toast.error("Microphone access denied. Please allow microphone access.");
      return false;
    }
  }, []);

  // Start listening with ElevenLabs
  const startListening = useCallback(async () => {
    if (scribe.isConnected || isConnecting) {
      console.log("Already listening or connecting");
      return;
    }

    const hasPermissionNow = hasPermission ?? (await requestPermission());
    if (!hasPermissionNow) return;

    setIsConnecting(true);
    
    try {
      // Get single-use token from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");
      
      if (error || !data?.token) {
        console.error("Failed to get scribe token:", error);
        toast.error("Failed to start voice recognition. Please try again.");
        setIsConnecting(false);
        return;
      }

      // Connect to ElevenLabs with microphone
      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      console.log("ElevenLabs Scribe connected");
    } catch (error) {
      console.error("Failed to connect to ElevenLabs:", error);
      toast.error("Voice recognition failed to start. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }, [scribe, isConnecting, hasPermission, requestPermission]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (scribe.isConnected) {
      // Force-commit any in-progress transcript before disconnecting.
      // This helps when VAD doesn't commit due to background noise.
      try {
        scribe.commit();
      } catch {
        // ignore
      }

      // Give commit a brief moment to flush, then disconnect.
      setTimeout(() => {
        try {
          scribe.disconnect();
        } catch {
          // ignore
        }
      }, 120);
      console.log("ElevenLabs Scribe disconnected");
    }
  }, [scribe]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (scribe.isConnected) {
      stopListening();
    } else {
      void startListening();
    }
  }, [scribe.isConnected, startListening, stopListening]);

  // Speak text using browser's built-in Speech Synthesis API
  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !text.trim() || !isTTSSupported) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      setIsSpeaking(true);

      // Split text into smaller chunks for natural speech
      const chunkText = (text: string, maxLength = 150): string[] => {
        const chunks: string[] = [];
        const sentences = text.split(/(?<=[.!?])\s+/);
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

        // Find a high-quality voice
        const getPreferredVoice = () => {
          if (preferredVoice && availableVoices.length > 0) {
            const found = availableVoices.find(v => v.name === preferredVoice);
            if (found) return found;
          }
          
          const naturalVoice = availableVoices.find(v => 
            v.name.toLowerCase().includes('natural') ||
            v.name.toLowerCase().includes('enhanced') ||
            v.name.toLowerCase().includes('premium')
          );
          if (naturalVoice) return naturalVoice;

          const googleVoice = availableVoices.find(v => 
            v.name.toLowerCase().includes('google')
          );
          if (googleVoice) return googleVoice;

          return availableVoices[0] || null;
        };

        const selectedVoice = getPreferredVoice();
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
          currentIndex++;
          if (currentIndex < chunks.length) {
            setTimeout(speakChunk, 50);
          } else {
            setIsSpeaking(false);
          }
        };

        utterance.onerror = (event) => {
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
      if (scribe.isConnected) {
        scribe.disconnect();
      }
      if (isTTSSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [scribe, isTTSSupported]);

  return {
    isListening,
    isConnecting,
    isSpeaking,
    transcript,
    hasPermission,
    isSupported: true, // ElevenLabs works in all browsers
    isTTSSupported,
    availableVoices,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    requestPermission,
  };
};
