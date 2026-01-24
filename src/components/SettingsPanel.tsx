import { motion, AnimatePresence } from "framer-motion";
import { X, Sliders, Palette, Sparkles } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { ModelSelector, AVAILABLE_MODELS } from "./ModelSelector";

interface Settings {
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  accentHue: number;
  systemPrompt: string;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

const ACCENT_PRESETS = [
  { name: "Cyan", hue: 185 },
  { name: "Purple", hue: 270 },
  { name: "Pink", hue: 330 },
  { name: "Orange", hue: 25 },
  { name: "Green", hue: 145 },
  { name: "Blue", hue: 210 },
];

export const SettingsPanel = ({ isOpen, onClose, settings, onSettingsChange }: SettingsPanelProps) => {
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value };
    onSettingsChange(newSettings);
    
    // Apply accent hue immediately
    if (key === "accentHue") {
      document.documentElement.style.setProperty("--accent-hue", String(value));
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 overflow-hidden"
          >
            <GlassCard variant="strong" className="h-full rounded-none rounded-l-2xl p-6 overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Model Selection */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-primary" />
                  <h3 className="font-medium">Model</h3>
                </div>
                <ModelSelector
                  selectedModel={settings.model}
                  onSelectModel={(model) => updateSetting("model", model)}
                />
              </div>

              {/* Parameters */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sliders size={18} className="text-primary" />
                  <h3 className="font-medium">Parameters</h3>
                </div>

                <div className="space-y-5">
                  {/* Temperature */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Temperature</label>
                      <span className="text-sm font-mono text-foreground">{settings.temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => updateSetting("temperature", parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  {/* Top P */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Top P</label>
                      <span className="text-sm font-mono text-foreground">{settings.topP.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.topP}
                      onChange={(e) => updateSetting("topP", parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Max Tokens</label>
                      <span className="text-sm font-mono text-foreground">{settings.maxTokens}</span>
                    </div>
                    <input
                      type="range"
                      min="256"
                      max="4096"
                      step="256"
                      value={settings.maxTokens}
                      onChange={(e) => updateSetting("maxTokens", parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={18} className="text-primary" />
                  <h3 className="font-medium">Accent Color</h3>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.hue}
                      onClick={() => updateSetting("accentHue", preset.hue)}
                      className={`w-full aspect-square rounded-lg transition-all ${
                        settings.accentHue === preset.hue
                          ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: `hsl(${preset.hue}, 100%, 50%)` }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-primary" />
                  <h3 className="font-medium">System Persona</h3>
                </div>
                <textarea
                  value={settings.systemPrompt}
                  onChange={(e) => updateSetting("systemPrompt", e.target.value)}
                  placeholder="Define Enma's personality and behavior..."
                  className="w-full h-32 bg-white/5 rounded-lg p-3 text-sm resize-none outline-none border border-white/10 focus:border-primary/50 transition-colors"
                />
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
