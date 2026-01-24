import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Cpu } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface Model {
  id: string;
  name: string;
  description: string;
}

const MODELS: Model[] = [
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", description: "Fast & balanced (Free)" },
  { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro", description: "Next-gen reasoning (Free)" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Quick responses (Free)" },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Lite", description: "Fastest & cheapest (Free)" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Advanced reasoning (Free)" },
  { id: "openai/gpt-5-nano", name: "GPT-5 Nano", description: "Speed optimized (Free)" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", description: "Efficient & capable (Free)" },
  { id: "openai/gpt-5", name: "GPT-5", description: "Maximum capability (Free)" },
  { id: "openai/gpt-5.2", name: "GPT-5.2", description: "Latest & enhanced (Free)" },
];

interface ModelPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelPopup = ({ isOpen, onClose, selectedModel, onSelectModel }: ModelPopupProps) => {
  const handleSelect = (modelId: string) => {
    onSelectModel(modelId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-4 top-[10%] bottom-auto z-50 mx-auto max-w-sm"
          >
            <GlassCard variant="strong" chromium className="p-4 border border-white/10 rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Cpu size={18} className="text-foreground" />
                  <h3 className="font-medium text-foreground">Select Model</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Model list - scrollable */}
              <div className="overflow-y-auto max-h-[60vh] pr-1">
                <div className="space-y-2 pb-2">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleSelect(model.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:scale-[1.01] ${
                        selectedModel === model.id
                          ? "bg-white/10 border border-white/20"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground">{model.name}</p>
                        <p className="text-xs text-muted-foreground">{model.description}</p>
                      </div>
                      {selectedModel === model.id && (
                        <Check size={16} className="text-foreground flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
