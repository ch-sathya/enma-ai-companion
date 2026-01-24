import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Square, Check, Volume2 } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface VoiceSelectorProps {
  selectedVoice: string;
  onSelectVoice: (voiceName: string) => void;
}

export const VoiceSelector = ({ selectedVoice, onSelectVoice }: VoiceSelectorProps) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  // Load browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filter to English voices, limit to 6 for UI
      const englishVoices = allVoices
        .filter(v => v.lang.startsWith('en'))
        .slice(0, 6);
      setVoices(englishVoices.length > 0 ? englishVoices : allVoices.slice(0, 6));
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const previewVoice = useCallback((voice: SpeechSynthesisVoice) => {
    if (playingVoice === voice.name) {
      window.speechSynthesis.cancel();
      setPlayingVoice(null);
      return;
    }

    window.speechSynthesis.cancel();
    setPlayingVoice(voice.name);

    const utterance = new SpeechSynthesisUtterance("Hello, I'm Enma. How can I help you today?");
    utterance.voice = voice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setPlayingVoice(null);
    utterance.onerror = () => setPlayingVoice(null);

    window.speechSynthesis.speak(utterance);
  }, [playingVoice]);

  const handleSelect = useCallback((voiceName: string) => {
    onSelectVoice(voiceName);
  }, [onSelectVoice]);

  const getVoiceLabel = (voice: SpeechSynthesisVoice) => {
    // Extract clean name
    let name = voice.name;
    // Remove common prefixes
    name = name.replace(/^(Microsoft |Google |Apple )/i, '');
    // Shorten if too long
    if (name.length > 20) {
      name = name.slice(0, 18) + '…';
    }
    return name;
  };

  if (voices.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-lg mx-auto mb-8"
    >
      <div className="flex items-center gap-2 mb-3">
        <Volume2 size={14} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Choose a voice</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {voices.map((voice) => {
          const isSelected = selectedVoice === voice.name;
          const isPlaying = playingVoice === voice.name;

          return (
            <GlassCard
              key={voice.name}
              variant="subtle"
              className={`p-3 cursor-pointer transition-all ${
                isSelected ? 'ring-1 ring-foreground/30' : ''
              }`}
              onClick={() => handleSelect(voice.name)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {isSelected && (
                    <Check size={12} className="text-foreground flex-shrink-0" />
                  )}
                  <span className="text-xs text-foreground truncate">
                    {getVoiceLabel(voice)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    previewVoice(voice);
                  }}
                  className={`p-1.5 rounded-md transition-all flex-shrink-0 ${
                    isPlaying
                      ? 'bg-foreground/20 text-foreground'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                  }`}
                  title={isPlaying ? "Stop" : "Preview"}
                >
                  {isPlaying ? <Square size={10} fill="currentColor" /> : <Play size={10} />}
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </motion.div>
  );
};