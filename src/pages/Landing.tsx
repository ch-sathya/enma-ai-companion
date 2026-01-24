import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Cpu, Shield, Palette, Sparkles } from "lucide-react";
import { EnmaLogo } from "@/components/EnmaLogo";
import { GlassCard } from "@/components/GlassCard";

const features = [
  {
    icon: Cpu,
    title: "Multiple Models",
    description: "Switch between Gemini, GPT, and more open-source LLMs seamlessly",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your conversations stay private with local-first architecture",
  },
  {
    icon: Palette,
    title: "Fully Customizable",
    description: "Tailor the interface, accent colors, and AI behavior to your style",
  },
  {
    icon: Sparkles,
    title: "Real-time Streaming",
    description: "Watch responses flow in real-time with beautiful animations",
  },
];

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-4xl mx-auto"
      >
        {/* Logo */}
        <div className="mb-8">
          <EnmaLogo size="xl" />
        </div>

        {/* Tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-2xl md:text-4xl font-light text-foreground/90 mb-4"
        >
          Your Personal AI Assistant
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-muted-foreground text-lg md:text-xl mb-12 max-w-2xl mx-auto"
        >
          A sleek, privacy-focused interface for open-source language models.
          Customizable. Powerful. Beautiful.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <button
            onClick={() => navigate("/chat")}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium text-lg transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              boxShadow: "0 0 40px hsl(var(--primary) / 0.4), 0 0 80px hsl(var(--primary) / 0.2)",
            }}
          >
            <span>Enter Enma</span>
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            
            {/* Animated border */}
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </button>
        </motion.div>
      </motion.div>

      {/* Features grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-6xl w-full z-10"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
          >
            <GlassCard
              variant="subtle"
              chromium
              className="p-6 h-full liquid-shine"
            >
              <feature.icon size={24} className="text-primary mb-4" />
              <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Version badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 text-xs text-muted-foreground/50"
      >
        v1.0.0 • Built with Lovable
      </motion.div>
    </div>
  );
};

export default Landing;
