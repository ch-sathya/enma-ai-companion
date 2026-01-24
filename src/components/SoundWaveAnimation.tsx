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
    <div className={`flex items-center justify-center gap-0.5 h-4 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className="soundwave-bar w-0.5 bg-primary rounded-full"
          style={{ 
            animationDelay: `${i * 0.1}s`,
            height: '4px'
          }}
        />
      ))}
    </div>
  );
};
