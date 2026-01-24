import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { Check, Cpu, Zap, Brain, Sparkles } from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  speed: "fast" | "balanced" | "slow";
  icon: "cpu" | "zap" | "brain" | "sparkles";
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "google/gemini-3-flash-preview",
    name: "Gemini Flash",
    description: "Fast and efficient for everyday tasks",
    speed: "fast",
    icon: "zap",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5",
    description: "Balanced performance and reasoning",
    speed: "balanced",
    icon: "sparkles",
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini Pro",
    description: "Advanced reasoning and context",
    speed: "slow",
    icon: "brain",
  },
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 Mini",
    description: "Strong reasoning, lower latency",
    speed: "balanced",
    icon: "cpu",
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

const iconMap = {
  cpu: Cpu,
  zap: Zap,
  brain: Brain,
  sparkles: Sparkles,
};

const speedLabels = {
  fast: "Fast",
  balanced: "Balanced",
  slow: "Thorough",
};

export const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {AVAILABLE_MODELS.map((model, index) => {
        const Icon = iconMap[model.icon];
        const isSelected = selectedModel === model.id;

        return (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              variant={isSelected ? "strong" : "subtle"}
              className={`p-4 cursor-pointer transition-all duration-300 hover:bg-white/5 ${
                isSelected ? "bg-white/10" : ""
              }`}
              onClick={() => onSelectModel(model.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/5 ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{model.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
                  </div>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-1 rounded-full bg-foreground text-background"
                  >
                    <Check size={12} />
                  </motion.div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {speedLabels[model.speed]}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </div>
  );
};
