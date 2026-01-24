import { Link } from "react-router-dom";

interface EnmaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
}

const EnmaSwordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    {/* Blade - purple with gradient effect */}
    <defs>
      <linearGradient id="bladeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9B7ED9" />
        <stop offset="50%" stopColor="#7B5DC3" />
        <stop offset="100%" stopColor="#5A3DA8" />
      </linearGradient>
      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#DAA520" />
        <stop offset="100%" stopColor="#B8860B" />
      </linearGradient>
    </defs>
    
    {/* Main blade */}
    <path 
      d="M56 8 L24 40" 
      stroke="url(#bladeGradient)" 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    
    {/* Blade tip */}
    <path 
      d="M56 8 L60 4" 
      stroke="#B8A0E8" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    
    {/* Hamon (wave pattern on blade) */}
    <path 
      d="M52 12 Q50 14, 48 12 Q46 10, 44 12 Q42 14, 40 12 Q38 10, 36 12 Q34 14, 32 12 Q30 10, 28 12" 
      stroke="rgba(255,255,255,0.4)" 
      strokeWidth="1" 
      fill="none"
      strokeLinecap="round"
    />
    
    {/* Black section near guard (habaki) */}
    <rect x="22" y="38" width="4" height="3" fill="#1a1a1a" rx="0.5" transform="rotate(-45 24 39.5)"/>
    
    {/* Gold guard (tsuba) - circular */}
    <circle cx="20" cy="44" r="5" fill="url(#goldGradient)" />
    <circle cx="20" cy="44" r="3.5" fill="none" stroke="#C5941A" strokeWidth="0.5" />
    <circle cx="20" cy="44" r="1.5" fill="#1a1a1a" />
    
    {/* Purple wrapped handle (tsuka) */}
    <path 
      d="M18 46 L8 56" 
      stroke="#6B3FA0" 
      strokeWidth="5" 
      strokeLinecap="round"
    />
    
    {/* Handle wrap pattern (ito) */}
    <path 
      d="M17 47 L15 49 M15 49 L13 51 M13 51 L11 53 M11 53 L9 55" 
      stroke="#4A2080" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    
    {/* Red/maroon kashira (pommel cap) */}
    <circle cx="6" cy="58" r="2.5" fill="#8B2252" />
  </svg>
);

export const EnmaLogo = ({ size = "md", showIcon = true }: EnmaLogoProps) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <Link to="/" className="flex items-center gap-2 group">
      {showIcon && (
        <div className="transition-transform duration-300 group-hover:rotate-12">
          <EnmaSwordIcon className={iconSizes[size]} />
        </div>
      )}
      <span className={`font-bold tracking-wider text-foreground ${sizeClasses[size]}`}>
        ENMA
      </span>
    </Link>
  );
};
