import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { EnmaLogo } from "@/components/EnmaLogo";
import { GlassCard } from "@/components/GlassCard";
const features = [{
  title: "Multiple Models",
  description: "Gemini, GPT, and more"
}, {
  title: "Privacy First",
  description: "Local-first architecture"
}, {
  title: "Customizable",
  description: "Personas for every task"
}, {
  title: "Real-time",
  description: "Streaming responses"
}];
export const Landing = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden safe-top safe-bottom">
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="ambient-orb w-[400px] h-[400px] bg-white/[0.03] top-1/4 left-1/4" style={{
        animationDelay: '0s'
      }} />
        <div className="ambient-orb w-[300px] h-[300px] bg-white/[0.02] bottom-1/4 right-1/4" style={{
        animationDelay: '-5s'
      }} />
        <div className="ambient-orb w-[200px] h-[200px] bg-white/[0.025] top-1/2 right-1/3" style={{
        animationDelay: '-10s'
      }} />
      </div>

      {/* Central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-white/[0.05] via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      duration: 0.8
    }} className="text-center z-10 max-w-3xl mx-auto">
        {/* Logo - Vertical centered layout */}
        <motion.div initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        delay: 0.1,
        duration: 0.8
      }} className="flex justify-center mb-8">
          <EnmaLogo size="xl" centered vertical asLink={false} glow />
        </motion.div>

        {/* Tagline */}
        <motion.p initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3,
        duration: 0.8
      }} className="text-muted-foreground text-lg md:text-xl mb-16 max-w-xl mx-auto leading-relaxed">
          A sleek, privacy-focused interface for open-source language models.
        </motion.p>

        {/* CTA Button - Enhanced */}
        <motion.div initial={{
        opacity: 0,
        scale: 0.95
      }} animate={{
        opacity: 1,
        scale: 1
      }} transition={{
        delay: 0.5,
        duration: 0.5
      }}>
          <button onClick={() => navigate("/chat")} className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-foreground text-background font-medium text-lg transition-all hover:bg-foreground/90 active:scale-[0.98] btn-glow pulse-glow enma-glow">
            <Sparkles size={20} className="opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="tracking-wide">Enter Enma</span>
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </motion.div>

      {/* Features grid - Enhanced */}
      <motion.div initial={{
      opacity: 0,
      y: 40
    }} animate={{
      opacity: 1,
      y: 0
    }} transition={{
      delay: 0.7,
      duration: 0.8
    }} className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-24 max-w-3xl w-full z-10">
        {features.map((feature, index) => <motion.div key={feature.title} initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.7 + index * 0.1
      }} whileHover={{
        scale: 1.02,
        y: -2
      }} className="hover-glow">
            <GlassCard variant="subtle" className="p-4 h-full text-center glass-glow enma-glow">
              <h3 className="font-medium text-foreground text-sm mb-1 tracking-wide">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </GlassCard>
          </motion.div>)}
      </motion.div>

      {/* Version badge */}
      
    </div>;
};
export default Landing;