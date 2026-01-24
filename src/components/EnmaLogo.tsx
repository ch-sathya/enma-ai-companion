import { Link } from "react-router-dom";

interface EnmaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
}

const KatanaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" className={className}>
    {/* Katana blade - elegant diagonal */}
    <path d="M6 42 L38 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    {/* Blade tip */}
    <path d="M38 10 L42 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Guard (tsuba) */}
    <ellipse cx="36" cy="12" rx="3" ry="1" fill="currentColor" transform="rotate(-45 36 12)"/>
    {/* Handle (tsuka) */}
    <path d="M6 42 L3 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
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
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-10 h-10",
    xl: "w-14 h-14",
  };

  return (
    <Link to="/" className="flex items-center gap-2 group">
      {showIcon && (
        <div className="text-foreground transition-transform duration-300 group-hover:rotate-12">
          <KatanaIcon className={iconSizes[size]} />
        </div>
      )}
      <span className={`font-bold tracking-wider text-foreground ${sizeClasses[size]}`}>
        ENMA
      </span>
    </Link>
  );
};
