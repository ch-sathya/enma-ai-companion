import { motion } from "framer-motion";

interface EnmaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  showIcon?: boolean;
}

export const EnmaLogo = ({ size = "md", animated = true, showIcon = true }: EnmaLogoProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-7xl",
  };

  const iconSizes = {
    sm: 20,
    md: 32,
    lg: 48,
    xl: 64,
  };

  const logoContent = (
    <div className="flex items-center gap-3">
      {showIcon && (
        <svg
          width={iconSizes[size]}
          height={iconSizes[size]}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          {/* Abstract geometric "E" mark */}
          <rect x="8" y="8" width="32" height="32" rx="4" stroke="white" strokeWidth="2" fill="none" />
          <path
            d="M16 16h16M16 24h12M16 32h16"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Corner accent */}
          <circle cx="38" cy="10" r="3" fill="white" />
        </svg>
      )}
      <span className={`font-semibold tracking-tight ${sizeClasses[size]} text-foreground`}>
        ENMA
      </span>
    </div>
  );

  if (!animated) return logoContent;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative"
    >
      {logoContent}
    </motion.div>
  );
};
