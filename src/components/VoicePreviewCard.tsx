import { motion } from "framer-motion";
import { Play, Square, Volume2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";

interface VoicePreviewCardProps {
  enabled: boolean;
  isSpeaking: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export const VoicePreviewCard = ({
  enabled,
  isSpeaking,
  onPlay,
  onStop,
}: VoicePreviewCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-6"
    >
      <GlassCard variant="subtle" glow className="p-4 prompt-card">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Volume2 size={14} className="text-muted-foreground" />
              <p className="text-sm text-foreground">Voice preview</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {enabled
                ? "Test Enma’s voice before you start."
                : "Enable Voice Responses in Settings to preview."}
            </p>
          </div>

          <button
            disabled={!enabled}
            onClick={isSpeaking ? onStop : onPlay}
            className={
              "p-2.5 rounded-lg transition-all " +
              (enabled
                ? "bg-white/10 hover:bg-white/20 text-foreground btn-glow"
                : "bg-white/5 text-muted-foreground cursor-not-allowed")
            }
            title={enabled ? (isSpeaking ? "Stop" : "Play") : "Enable voice in settings"}
          >
            {isSpeaking ? <Square size={16} /> : <Play size={16} />}
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
};
