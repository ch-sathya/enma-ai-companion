import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EnmaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
  centered?: boolean;
  asLink?: boolean;
}

export const EnmaLogo = ({ 
  size = "md", 
  showIcon = true, 
  centered = false,
  asLink = true 
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
    xl: "w-16 h-16",
  };

  const content = (
    <>
      {showIcon && (
        <img
          src="/enma-logo.png"
          alt="Enma"
          className={cn(
            iconSizes[size],
            "object-contain transition-transform duration-300 group-hover:rotate-12"
          )}
          style={{ 
            filter: 'brightness(0.95) contrast(1.05)',
            mixBlendMode: 'normal'
          }}
        />
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
    "flex items-center gap-2 group",
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
