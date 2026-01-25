import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import enmaKatanaLogo from "@/assets/enma-katana-logo.png";
import { useTransparentImage } from "@/hooks/useTransparentImage";

interface EnmaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
  centered?: boolean;
  asLink?: boolean;
  vertical?: boolean;
  glow?: boolean;
  animate?: boolean;
}

export const EnmaLogo = ({ 
  size = "md", 
  showIcon = true, 
  centered = false,
  asLink = true,
  vertical = false,
  glow = false,
  animate = true,
}: EnmaLogoProps) => {
  const logoSrc = useTransparentImage(enmaKatanaLogo);

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
        <motion.div 
          className={cn(
            "relative transition-transform duration-500 group-hover:rotate-12",
            glow && "after:absolute after:inset-0 after:rounded-full after:bg-white/20 after:blur-xl after:scale-150 after:opacity-50"
          )}
          initial={animate ? { opacity: 0, scale: 0.5, rotate: -10 } : false}
          animate={animate ? { opacity: 1, scale: 1, rotate: 0 } : false}
          whileHover={{ scale: 1.05 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1,
          }}
        >
          {/* Pulsing glow effect on hover */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white/30 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            animate={{ 
              scale: [1.3, 1.6, 1.3],
              opacity: [0, 0.4, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ pointerEvents: 'none' }}
          />
          <img
            src={logoSrc}
            alt="Enma"
            className={cn(
              iconSizes[size],
              "object-contain relative z-10"
            )}
          />
        </motion.div>
      )}
      <motion.span
        className={cn(
          "font-bold tracking-wider text-foreground",
          sizeClasses[size]
        )}
        initial={animate ? { opacity: 0, y: 8 } : false}
        animate={animate ? { opacity: 1, y: 0 } : false}
        transition={{
          duration: 0.4,
          delay: 0.2,
          ease: "easeOut",
        }}
      >
        ENMA
      </motion.span>
    </>
  );

  const className = cn(
    "flex items-center group",
    vertical ? "flex-col gap-2" : "gap-2",
    centered && "justify-center mx-auto"
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
