import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, ExternalLink, Check, AlertCircle, Loader2, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/GlassCard";
import { useProviders } from "@/hooks/useProviders";
import { getProvider } from "@/lib/providers";
import { toast } from "sonner";

interface ProviderSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  initialProviderId?: string;
}

export const ProviderSettings = ({
  isOpen,
  onClose,
  initialProviderId,
}: ProviderSettingsProps) => {
  const { state, activeProviderId, updateProvider, setActiveProvider, allProviders } =
    useProviders();

  const [selectedId, setSelectedId] = useState(initialProviderId || activeProviderId);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  const provider = getProvider(selectedId);
  const settings = state.providers[selectedId] || {
    apiKey: "",
    baseUrl: provider?.defaultBaseUrl,
    model: provider?.defaultModels[0] || "",
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedId(initialProviderId || activeProviderId);
      setTestResult(null);
      setShowKey(false);
    }
  }, [isOpen, initialProviderId, activeProviderId]);

  if (!provider) return null;

  const handleSave = () => {
    if (!settings.model) {
      toast.error("Please choose a model");
      return;
    }
    if (!settings.apiKey && provider.id !== "ollama") {
      toast.error("API key is required");
      return;
    }
    setActiveProvider(selectedId);
    toast.success(`${provider.name} connected`);
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await provider.testConnection({
        apiKey: settings.apiKey || (provider.id === "ollama" ? "ollama" : ""),
        baseUrl: settings.baseUrl,
        model: settings.model,
      });
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed left-4 right-4 top-[6%] z-50 mx-auto max-w-lg"
          >
            <GlassCard
              variant="clean"
              className="flex flex-col max-h-[calc(100dvh-4rem)] overflow-hidden border border-white/10 rounded-2xl shadow-2xl"
            >
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/5">
                    <Key size={16} className="text-foreground" />
                  </div>
                  <h2 className="font-medium text-foreground">Connect a Model</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
                {/* Provider grid */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Provider</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {allProviders.map((p) => {
                      const configured = !!state.providers[p.id]?.apiKey || p.id === "ollama";
                      const active = state.activeProviderId === p.id && configured;
                      const selected = selectedId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedId(p.id);
                            setTestResult(null);
                          }}
                          className={`text-left p-3 rounded-xl border transition-all ${
                            selected
                              ? "bg-white/10 border-white/25"
                              : "bg-white/5 border-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground font-medium">{p.name}</span>
                            {active && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {p.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* API key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-muted-foreground">{provider.apiKeyLabel}</Label>
                    {provider.apiKeyUrl && (
                      <a
                        href={provider.apiKeyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        Get key <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={settings.apiKey}
                      onChange={(e) =>
                        updateProvider(selectedId, { apiKey: e.target.value })
                      }
                      placeholder={provider.apiKeyHint}
                      className="bg-white/5 border-white/10 focus:border-white/20 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10"
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">
                    Stored only on this device. Never sent anywhere except the provider.
                  </p>
                </div>

                {/* Base URL */}
                {provider.baseUrlEditable && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Base URL</Label>
                    <Input
                      value={settings.baseUrl || provider.defaultBaseUrl}
                      onChange={(e) =>
                        updateProvider(selectedId, { baseUrl: e.target.value })
                      }
                      placeholder={provider.defaultBaseUrl}
                      className="bg-white/5 border-white/10 focus:border-white/20 rounded-xl font-mono text-xs"
                    />
                  </div>
                )}

                {/* Model */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Model</Label>
                  <Input
                    value={settings.model || ""}
                    onChange={(e) => updateProvider(selectedId, { model: e.target.value })}
                    placeholder={provider.defaultModels[0] || "model-name"}
                    className="bg-white/5 border-white/10 focus:border-white/20 rounded-xl font-mono text-xs"
                  />
                  {provider.defaultModels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {provider.defaultModels.map((m) => (
                        <button
                          key={m}
                          onClick={() => updateProvider(selectedId, { model: m })}
                          className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                            settings.model === m
                              ? "bg-white/15 border-white/25 text-foreground"
                              : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Test result */}
                {testResult && (
                  <div
                    className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${
                      testResult.ok
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-200"
                    }`}
                  >
                    {testResult.ok ? (
                      <Check size={14} className="mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    )}
                    <span>
                      {testResult.ok
                        ? "Connection works."
                        : `Failed: ${testResult.error || "unknown error"}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-4 border-t border-white/5 flex gap-2">
                <button
                  onClick={handleTest}
                  disabled={testing || (!settings.apiKey && provider.id !== "ollama")}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-sm text-foreground border border-white/10 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {testing ? <Loader2 size={14} className="animate-spin" /> : null}
                  Test
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-foreground text-background hover:opacity-90 transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Check size={14} />
                  Save & Use
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
