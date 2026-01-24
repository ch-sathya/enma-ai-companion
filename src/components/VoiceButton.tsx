import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  onToggle: () => void;
  onStopSpeaking?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const VoiceButton = ({
  isListening,
  isSpeaking,
  isSupported,
  onToggle,
  onStopSpeaking,
  className,
  size = "md",
}: VoiceButtonProps) => {
  if (!isSupported) return null;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const handleClick = () => {
    if (isSpeaking && onStopSpeaking) {
      onStopSpeaking();
    } else {
      onToggle();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={cn(
        "relative rounded-full flex items-center justify-center transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        isListening
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
          : isSpeaking
          ? "bg-accent text-accent-foreground"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
        sizeClasses[size],
        className
      )}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      aria-label={isListening ? "Stop listening" : isSpeaking ? "Stop speaking" : "Start voice input"}
    >
      {/* Animated rings when listening */}
      <AnimatePresence>
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5,
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Speaking animation */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(45deg, hsl(var(--accent)), hsl(var(--primary)))",
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <motion.div
        className="relative z-10"
        animate={isListening ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
      >
        {isSpeaking ? (
          <Volume2 size={iconSizes[size]} />
        ) : isListening ? (
          <Mic size={iconSizes[size]} />
        ) : (
          <Mic size={iconSizes[size]} />
        )}
      </motion.div>
    </motion.button>
  );
};
