import { motion } from "framer-motion";

interface SoundWaveAnimationProps {
  isActive: boolean;
  barCount?: number;
  className?: string;
}

export const SoundWaveAnimation = ({
  isActive,
  barCount = 5,
  className = "",
}: SoundWaveAnimationProps) => {
  if (!isActive) return null;

  return (
    <div className={`flex items-center justify-center gap-0.5 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-primary rounded-full"
          initial={{ height: 4 }}
          animate={{
            height: [4, 16, 8, 20, 4],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
};
