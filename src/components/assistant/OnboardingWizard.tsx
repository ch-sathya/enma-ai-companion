import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { useProfile } from "@/hooks/useProfile";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingWizard = ({ isOpen, onClose }: Props) => {
  const { profile, update } = useProfile();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [hours, setHours] = useState(profile.workingHours);
  const [style, setStyle] = useState<typeof profile.commStyle>(profile.commStyle);
  const [interests, setInterests] = useState(profile.interests.join(", "));

  const finish = () => {
    update({
      name: name.trim(),
      role: role.trim(),
      workingHours: hours.trim(),
      commStyle: style,
      interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
      onboarded: true,
    });
    onClose();
  };

  const steps = [
    {
      title: "Hi! I'm Enma.",
      sub: "Your private, local-first personal assistant. Let's get to know each other — this stays on your device.",
      content: (
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">What should I call you?</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-white/20" autoFocus />
          <label className="block text-xs uppercase tracking-wider text-muted-foreground pt-2">What do you do?</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Software engineer, student, parent…" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-white/20" />
        </div>
      ),
    },
    {
      title: "Your rhythm",
      sub: "I'll use this to suggest sensible times for tasks and reminders.",
      content: (
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">Working hours</label>
          <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 9:00 - 18:00" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-white/20" />
          <label className="block text-xs uppercase tracking-wider text-muted-foreground pt-2">How should I talk?</label>
          <div className="grid grid-cols-3 gap-2">
            {(["concise", "balanced", "detailed"] as const).map((s) => (
              <button key={s} onClick={() => setStyle(s)} className={`py-2.5 rounded-xl text-sm border transition-colors ${style === s ? "bg-white/15 border-white/30 text-foreground" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}>
                {s[0].toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "What interests you?",
      sub: "A few topics, comma-separated. Helps me bring up relevant ideas.",
      content: (
        <div className="space-y-3">
          <textarea value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="e.g. cooking, machine learning, hiking" className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-white/20 resize-none" />
          <p className="text-xs text-muted-foreground/70">You can change all of this later in Settings.</p>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-50" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
          >
            <GlassCard variant="strong" className="border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles size={12} /> Step {step + 1} of {steps.length}
                  </div>
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"><X size={16} /></button>
                </div>
                <h2 className="text-xl font-semibold text-foreground">{current.title}</h2>
                <p className="text-sm text-muted-foreground mt-1 mb-5">{current.sub}</p>
                {current.content}

                <div className="mt-6 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="px-3 py-2 rounded-xl bg-white/5 text-sm flex items-center gap-1.5 border border-white/10 disabled:opacity-40"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  {step < steps.length - 1 ? (
                    <button onClick={() => setStep((s) => s + 1)} className="px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium flex items-center gap-1.5 hover:opacity-90">
                      Next <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button onClick={finish} className="px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium flex items-center gap-1.5 hover:opacity-90">
                      <Check size={14} /> Done
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
