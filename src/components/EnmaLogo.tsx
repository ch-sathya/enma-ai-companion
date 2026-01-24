import { Link } from "react-router-dom";

interface EnmaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
}

export const EnmaLogo = ({ size = "md", showIcon = true }: EnmaLogoProps) => {
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

  return (
    <Link to="/" className="flex items-center gap-2 group">
      {showIcon && (
        <img
          src="/enma-logo.png"
          alt="Enma"
          className={`${iconSizes[size]} object-contain transition-transform duration-300 group-hover:rotate-12`}
        />
      )}
      <span
        className={`font-bold tracking-wider text-foreground ${sizeClasses[size]}`}
      >
        ENMA
      </span>
    </Link>
  );
};
