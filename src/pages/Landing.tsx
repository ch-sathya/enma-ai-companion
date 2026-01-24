import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { EnmaLogo } from "@/components/EnmaLogo";
import { GlassCard } from "@/components/GlassCard";

const features = [
  {
    title: "Multiple Models",
    description: "Gemini, GPT, and more",
  },
  {
    title: "Privacy First",
    description: "Local-first architecture",
  },
  {
    title: "Customizable",
    description: "Personas for every task",
  },
  {
    title: "Real-time",
    description: "Streaming responses",
  },
];

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden safe-top safe-bottom">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-3xl mx-auto"
      >
        {/* Logo */}
        <div className="mb-12">
          <EnmaLogo size="xl" />
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-muted-foreground text-lg md:text-xl mb-16 max-w-xl mx-auto leading-relaxed"
        >
          A sleek, privacy-focused interface for open-source language models.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <button
            onClick={() => navigate("/chat")}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-foreground text-background font-medium text-lg transition-all hover:bg-foreground/90 active:scale-[0.98]"
          >
            <span>Enter Enma</span>
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </motion.div>

      {/* Features grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-24 max-w-3xl w-full z-10"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
          >
            <GlassCard
              variant="subtle"
              className="p-4 h-full text-center"
            >
              <h3 className="font-medium text-foreground text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Version badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 text-xs text-muted-foreground/30"
      >
        v1.0.0
      </motion.div>
    </div>
  );
};

export default Landing;
