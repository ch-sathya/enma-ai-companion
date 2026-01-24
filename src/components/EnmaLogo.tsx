import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EnmaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
  centered?: boolean;
  asLink?: boolean;
  vertical?: boolean;
  glow?: boolean;
}

export const EnmaLogo = ({ 
  size = "md", 
  showIcon = true, 
  centered = false,
  asLink = true,
  vertical = false,
  glow = false,
}: EnmaLogoProps) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-20 h-20",
  };

  const content = (
    <>
      {showIcon && (
        <div className={cn(
          "relative transition-transform duration-500 group-hover:rotate-12",
          glow && "after:absolute after:inset-0 after:rounded-full after:bg-white/20 after:blur-xl after:scale-150 after:opacity-50"
        )}>
          <img
            src="/enma-logo.png"
            alt="Enma"
            className={cn(
              iconSizes[size],
              "object-contain relative z-10"
            )}
            style={{ 
              filter: 'brightness(0.95) contrast(1.05)',
              mixBlendMode: 'normal'
            }}
          />
        </div>
      )}
      <span
        className={cn(
          "font-bold tracking-wider text-foreground",
          sizeClasses[size]
        )}
      >
        ENMA
      </span>
    </>
  );

  const className = cn(
    "flex items-center group",
    vertical ? "flex-col gap-4" : "gap-2",
    centered && "justify-center"
  );

  if (!asLink) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link to="/" className={className}>
      {content}
    </Link>
  );
};
