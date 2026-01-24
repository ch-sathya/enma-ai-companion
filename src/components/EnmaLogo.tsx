import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EnmaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
  centered?: boolean;
  asLink?: boolean;
  vertical?: boolean;
  glow?: boolean;
  darkIcon?: boolean;
}

export const EnmaLogo = ({ 
  size = "md", 
  showIcon = true, 
  centered = false,
  asLink = true,
  vertical = false,
  glow = false,
  darkIcon = false,
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
          "relative transition-transform duration-500 group-hover:rotate-12 rounded-full flex items-center justify-center",
          darkIcon ? "bg-black border border-white/20" : "bg-transparent",
          size === "sm" && "w-8 h-8",
          size === "md" && "w-10 h-10",
          size === "lg" && "w-14 h-14",
          size === "xl" && "w-24 h-24",
          glow && "after:absolute after:inset-0 after:rounded-full after:bg-white/20 after:blur-xl after:scale-150 after:opacity-50"
        )}>
          <img
            src="/enma-logo-white.svg"
            alt="Enma"
            className={cn(
              "object-contain relative z-10",
              size === "sm" && "w-5 h-5",
              size === "md" && "w-6 h-6",
              size === "lg" && "w-9 h-9",
              size === "xl" && "w-16 h-16"
            )}
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
