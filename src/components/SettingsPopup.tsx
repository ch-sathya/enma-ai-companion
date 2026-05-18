import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Volume2, Mic, Check, Play, Square } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GlassCard } from "@/components/GlassCard";
import { ThemePanel } from "@/components/ThemePanel";
import { UserPreferences } from "@/hooks/useUserPreferences";

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (updates: Partial<UserPreferences>) => Promise<void>;
}

export const SettingsPopup = ({
  isOpen,
  onClose,
  preferences,
  onSave,
}: SettingsPopupProps) => {
  const [displayName, setDisplayName] = useState(preferences.display_name || "");
  const [voiceEnabled, setVoiceEnabled] = useState(preferences.voice_enabled);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(preferences.wake_word_enabled);
  const [preferredVoice, setPreferredVoice] = useState(preferences.preferred_voice);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<string | null>(null);

  const [voicesLoading, setVoicesLoading] = useState(true);
  
  // Load browser voices with retry logic for Chrome
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setVoicesLoading(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        // Chrome sometimes delays voice loading - retry
        return false;
      }
      
      // Filter to English voices and prioritize high-quality ones
      const englishVoices = voices
        .filter(v => v.lang.startsWith('en'))
        .sort((a, b) => {
          // Prioritize Neural/Natural/Premium voices
          const qualityKeywords = ['neural', 'natural', 'premium', 'enhanced', 'wavenet'];
          const aQuality = qualityKeywords.some(k => a.name.toLowerCase().includes(k)) ? 2 : 0;
          const bQuality = qualityKeywords.some(k => b.name.toLowerCase().includes(k)) ? 2 : 0;
          if (bQuality !== aQuality) return bQuality - aQuality;
          
          // Then prioritize Google/Microsoft voices
          const aProvider = a.name.includes('Google') ? 1 : a.name.includes('Microsoft') ? 0.5 : 0;
          const bProvider = b.name.includes('Google') ? 1 : b.name.includes('Microsoft') ? 0.5 : 0;
          return bProvider - aProvider;
        })
        .slice(0, 12); // Limit to top 12 voices
      
      setBrowserVoices(englishVoices.length > 0 ? englishVoices : voices.slice(0, 12));
      setVoicesLoading(false);
      return true;
    };

    // Initial load
    if (!loadVoices()) {
      // Retry a few times for Chrome
      let retries = 0;
      const retryInterval = setInterval(() => {
        if (loadVoices() || retries >= 5) {
          clearInterval(retryInterval);
          setVoicesLoading(false);
        }
        retries++;
      }, 200);
      
      return () => clearInterval(retryInterval);
    }
    
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    setDisplayName(preferences.display_name || "");
    setVoiceEnabled(preferences.voice_enabled);
    setWakeWordEnabled(preferences.wake_word_enabled);
    setPreferredVoice(preferences.preferred_voice);
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      display_name: displayName || null,
      voice_enabled: voiceEnabled,
      wake_word_enabled: wakeWordEnabled,
      preferred_voice: preferredVoice,
    });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const previewVoice = (voiceName: string) => {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    setIsPreviewPlaying(voiceName);

    const utterance = new SpeechSynthesisUtterance("Hello! I'm Enma, your AI assistant. How can I help you today?");
    const voice = browserVoices.find(v => v.name === voiceName);
    if (voice) {
      utterance.voice = voice;
    }
    // Slightly slower for better quality preview
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPreviewPlaying(null);
    utterance.onerror = () => setIsPreviewPlaying(null);

    window.speechSynthesis.speak(utterance);
  };

  const stopPreview = () => {
    window.speechSynthesis?.cancel();
    setIsPreviewPlaying(null);
  };

  const getVoiceDescription = (voice: SpeechSynthesisVoice): string => {
    const name = voice.name.toLowerCase();
    if (name.includes('neural') || name.includes('natural')) return "High Quality • Natural";
    if (name.includes('premium') || name.includes('enhanced')) return "Premium Quality";
    if (name.includes('wavenet')) return "WaveNet • Realistic";
    if (voice.name.includes('Google')) return "Google Voice";
    if (voice.name.includes('Microsoft')) return "Microsoft Voice";
    if (voice.localService) return "Offline Available";
    return voice.lang;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-4 right-4 top-[8%] z-50 mx-auto max-w-md"
          >
            <GlassCard
              variant="clean"
              className="flex flex-col max-h-[calc(100dvh-5rem)] overflow-hidden border border-white/10 rounded-2xl shadow-2xl"
            >
              {/* Header - Fixed */}
              <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/5">
                    <User size={16} className="text-foreground" />
                  </div>
                  <h2 className="font-medium text-foreground">Settings</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content - scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Your Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="What should Enma call you?"
                    className="bg-white/5 border-white/10 focus:border-white/20 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground/70">
                    Enma will address you by this name in conversations
                  </p>
                </div>

                {/* Theme engine */}
                <ThemePanel />

                {/* Voice Settings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Volume2 size={14} />
                    <span>Voice Settings</span>
                  </div>

                  {/* Voice Enabled */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-sm text-foreground">Voice Responses</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Enma speaks responses aloud (free)
                      </p>
                    </div>
                    <Switch
                      checked={voiceEnabled}
                      onCheckedChange={setVoiceEnabled}
                    />
                  </div>

                  {/* Wake Word */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-sm text-foreground flex items-center gap-1.5">
                        <Mic size={12} />
                        Wake Word Detection
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Say "Enma" to start talking
                      </p>
                    </div>
                    <Switch
                      checked={wakeWordEnabled}
                      onCheckedChange={setWakeWordEnabled}
                    />
                  </div>

                  {/* Voice Selection */}
                  {voiceEnabled && browserVoices.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label className="text-sm text-muted-foreground">Enma's Voice</Label>
                      <p className="text-xs text-muted-foreground/70 mb-2">
                        Click play to preview each voice
                      </p>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                        {browserVoices.map((voice) => (
                          <button
                            key={voice.name}
                            onClick={() => setPreferredVoice(voice.name)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                              preferredVoice === voice.name
                                ? "bg-white/10 border border-white/20 shadow-lg"
                                : "bg-white/5 border border-transparent hover:border-white/10"
                            }`}
                          >
                            <div className="flex-1 min-w-0 text-left">
                              <div className="text-sm text-foreground truncate group-hover:text-white transition-colors">
                                {voice.name.replace(/Microsoft |Google |Apple /, '')}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {getVoiceDescription(voice)}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                isPreviewPlaying === voice.name ? stopPreview() : previewVoice(voice.name);
                              }}
                              className={`p-2 rounded-lg transition-all ml-2 flex-shrink-0 ${
                                isPreviewPlaying === voice.name
                                  ? "bg-white/20 text-foreground"
                                  : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                              }`}
                              title={isPreviewPlaying === voice.name ? "Stop preview" : "Preview voice"}
                            >
                              {isPreviewPlaying === voice.name ? (
                                <Square size={12} />
                              ) : (
                                <Play size={12} />
                              )}
                            </button>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {voiceEnabled && browserVoices.length === 0 && voicesLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-3 h-3 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                      Loading available voices...
                    </div>
                  )}
                  
                  {voiceEnabled && browserVoices.length === 0 && !voicesLoading && (
                    <p className="text-xs text-muted-foreground/70">
                      No voices available. Voice responses will use system default.
                    </p>
                  )}
                  
                  {voiceEnabled && browserVoices.length > 0 && (
                    <p className="text-xs text-muted-foreground/60">
                      {browserVoices.length} voices available
                    </p>
                  )}
                </div>
              </div>

              {/* Footer - fixed at bottom */}
              <div className="flex-shrink-0 p-4 border-t border-white/5">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 transition-all duration-200 text-sm font-medium text-foreground border border-white/10 hover:border-white/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saved ? (
                    <>
                      <Check size={16} />
                      Saved!
                    </>
                  ) : isSaving ? (
                    "Saving..."
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
