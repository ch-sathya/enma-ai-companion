import { motion, AnimatePresence } from "framer-motion";

interface SparkleEffectProps {
  isActive: boolean;
  className?: string;
}

const generateSparkles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100 - 50,
    y: Math.random() * 100 - 50,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 0.5,
    duration: Math.random() * 1 + 1,
  }));
};

export const SparkleEffect = ({ isActive, className = "" }: SparkleEffectProps) => {
  const sparkles = generateSparkles(8);

  return (
    <AnimatePresence>
      {isActive && (
        <div className={`absolute inset-0 pointer-events-none overflow-visible ${className}`}>
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              className="absolute left-1/2 top-1/2"
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: 0,
                y: 0,
              }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: sparkle.x,
                y: sparkle.y,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: sparkle.duration,
                delay: sparkle.delay,
                repeat: Infinity,
                repeatDelay: Math.random() * 2,
                ease: "easeOut",
              }}
            >
              <svg
                width={sparkle.size}
                height={sparkle.size}
                viewBox="0 0 24 24"
                fill="none"
                className="text-white/80"
              >
                <path
                  d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
                  fill="currentColor"
                />
              </svg>
            </motion.div>
          ))}
          
          {/* Pulsing ring effect */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.5, 0.8],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
};
