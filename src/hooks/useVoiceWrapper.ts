import { useVoice } from "./useVoice";
import { useElevenLabsVoice } from "./useElevenLabsVoice";
import { useAppConfig } from "@/config/appConfig";

interface VoiceOptions {
  onTranscript?: (text: string) => void;
  onWakeWord?: () => void;
  wakeWordEnabled?: boolean;
  voiceEnabled?: boolean;
  preferredVoice?: string;
}

export const useVoiceWrapper = (options: VoiceOptions = {}) => {
  const config = useAppConfig();
  
  // Browser's Web Speech API (works offline)
  const webSpeechHook = useVoice({
    onTranscript: options.onTranscript,
    onWakeWord: options.onWakeWord,
    wakeWordEnabled: options.wakeWordEnabled,
    voiceEnabled: options.voiceEnabled,
    preferredVoice: options.preferredVoice,
  });

  // ElevenLabs API - only initialize when NOT in demo mode
  const elevenLabsHook = useElevenLabsVoice({
    onTranscript: config.isDemo ? undefined : options.onTranscript,
    voiceEnabled: config.isDemo ? false : options.voiceEnabled,
    preferredVoice: options.preferredVoice,
    enabled: !config.isDemo,
  });

  if (config.isDemo) {
    // Use browser's native Web Speech API in demo mode
    return {
      isListening: webSpeechHook.isListening,
      isSpeaking: webSpeechHook.isSpeaking,
      isSupported: webSpeechHook.isSupported,
      isConnecting: false,
      transcript: webSpeechHook.transcript,
      toggleListening: webSpeechHook.toggleListening,
      speak: webSpeechHook.speak,
      stopSpeaking: webSpeechHook.stopSpeaking,
      startWakeWordDetection: webSpeechHook.startWakeWordDetection,
      stopWakeWordDetection: webSpeechHook.stopWakeWordDetection,
      isWakeWordMode: webSpeechHook.isWakeWordMode,
    };
  }

  // Use ElevenLabs in cloud mode
  return {
    isListening: elevenLabsHook.isListening,
    isSpeaking: elevenLabsHook.isSpeaking,
    isSupported: elevenLabsHook.isSupported,
    isConnecting: elevenLabsHook.isConnecting,
    transcript: elevenLabsHook.transcript,
    toggleListening: elevenLabsHook.toggleListening,
    speak: elevenLabsHook.speak,
    stopSpeaking: elevenLabsHook.stopSpeaking,
    startWakeWordDetection: () => {},
    stopWakeWordDetection: () => {},
    isWakeWordMode: false,
  };
};
