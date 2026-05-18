import { motion } from "framer-motion";

interface VoiceWaveformProps {
  level: number; // 0..1
  active?: boolean;
  bars?: number;
  className?: string;
}

export const VoiceWaveform = ({ level, active = true, bars = 24, className }: VoiceWaveformProps) => {
  return (
    <div className={`flex items-end justify-center gap-[3px] h-10 ${className ?? ""}`}>
      {Array.from({ length: bars }).map((_, i) => {
        const offset = Math.sin((i / bars) * Math.PI);
        const h = active ? Math.max(0.08, level * (0.4 + offset * 0.9)) : 0.05;
        return (
          <motion.span
            key={i}
            animate={{ height: `${Math.min(100, h * 100)}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="w-[3px] rounded-full bg-gradient-to-t from-[hsl(var(--enma-purple))] to-[hsl(var(--enma-gold))]"
            style={{ opacity: 0.55 + offset * 0.45 }}
          />
        );
      })}
    </div>
  );
};
