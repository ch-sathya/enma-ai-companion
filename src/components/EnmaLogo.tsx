import { motion } from "framer-motion";

interface EnmaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

export const EnmaLogo = ({ size = "md", animated = true }: EnmaLogoProps) => {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
    xl: "text-8xl",
  };

  const logoContent = (
    <span className={`font-bold tracking-tighter ${sizeClasses[size]}`}>
      <span className="text-gradient-primary">EN</span>
      <span className="text-foreground">MA</span>
    </span>
  );

  if (!animated) return logoContent;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative"
    >
      {logoContent}
      <motion.div
        className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl -z-10"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};
