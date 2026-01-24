import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Cpu, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { ModelSettings } from "./ModelSettings";

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
  temperature: number;
  topP: number;
  maxTokens: number;
  onTemperatureChange: (value: number) => void;
  onTopPChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
}

export const ModelPopup = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
  temperature,
  topP,
  maxTokens,
  onTemperatureChange,
  onTopPChange,
  onMaxTokensChange,
}: ModelPopupProps) => {
  const [showSettings, setShowSettings] = useState(false);

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-4 right-4 top-[10%] z-50 mx-auto max-w-sm"
          >
            <GlassCard 
              variant="clean" 
              className="flex flex-col max-h-[calc(100dvh-6rem)] overflow-hidden border border-white/10 rounded-2xl shadow-2xl"
            >
              {/* Header - Fixed */}
              <div className="flex items-center justify-between p-4 pb-3 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/5">
                    <Cpu size={16} className="text-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground">Select Model</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 hover:scale-105"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {/* Model list */}
                <div className="p-3 space-y-1.5">
                  {MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleSelect(model.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                        selectedModel === model.id
                          ? "bg-white/10 border border-white/20 shadow-lg"
                          : "hover:bg-white/5 border border-transparent hover:border-white/10"
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-foreground group-hover:text-white transition-colors">
                          {model.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
                      </div>
                      {selectedModel === model.id && (
                        <div className="p-1 rounded-full bg-white/10">
                          <Check size={14} className="text-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="mx-4 border-t border-white/5" />

                {/* Fine-tune Settings Toggle */}
                <div className="p-3">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-all duration-200 border border-white/5 hover:border-white/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <Settings2 size={14} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Fine-tune Settings</span>
                    </div>
                    <motion.div
                      animate={{ rotate: showSettings ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={14} className="text-muted-foreground" />
                    </motion.div>
                  </button>

                  {/* Settings Panel */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 px-1">
                          <ModelSettings
                            temperature={temperature}
                            topP={topP}
                            maxTokens={maxTokens}
                            onTemperatureChange={onTemperatureChange}
                            onTopPChange={onTopPChange}
                            onMaxTokensChange={onMaxTokensChange}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
