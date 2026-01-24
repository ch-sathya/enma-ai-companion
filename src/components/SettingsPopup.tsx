import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Volume2, Mic, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GlassCard } from "@/components/GlassCard";
import { UserPreferences } from "@/hooks/useUserPreferences";

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (updates: Partial<UserPreferences>) => Promise<void>;
}

const VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Warm & natural" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Deep & calm" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Soft & friendly" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Professional" },
];

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <GlassCard
              variant="strong"
              className="p-0 flex flex-col w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold text-foreground">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content - scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-foreground">
                    <User size={16} />
                    Your Name
                  </Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="What should Enma call you?"
                    className="bg-white/5 border-white/10 focus:border-primary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enma will address you by this name in conversations
                  </p>
                </div>

                {/* Voice Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Volume2 size={16} />
                    Voice Settings
                  </h3>

                  {/* Voice Enabled */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">Voice Responses</Label>
                      <p className="text-xs text-muted-foreground">
                        Enma speaks responses aloud
                      </p>
                    </div>
                    <Switch
                      checked={voiceEnabled}
                      onCheckedChange={setVoiceEnabled}
                    />
                  </div>

                  {/* Wake Word */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground flex items-center gap-2">
                        <Mic size={14} />
                        Wake Word Detection
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Say "Enma" to start talking
                      </p>
                    </div>
                    <Switch
                      checked={wakeWordEnabled}
                      onCheckedChange={setWakeWordEnabled}
                    />
                  </div>

                  {/* Voice Selection */}
                  {voiceEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label className="text-foreground">Enma's Voice</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {VOICES.map((voice) => (
                          <button
                            key={voice.id}
                            onClick={() => setPreferredVoice(voice.id)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              preferredVoice === voice.id
                                ? "border-primary bg-primary/10"
                                : "border-white/10 bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            <div className="font-medium text-sm text-foreground">
                              {voice.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {voice.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer - fixed at bottom */}
              <div className="flex-shrink-0 p-4 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium transition-all hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saved ? (
                    <>
                      <Check size={18} />
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
