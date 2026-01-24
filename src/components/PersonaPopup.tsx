import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { PERSONAS, Persona } from "@/data/personas";

interface PersonaPopupProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPersonaId: string;
  onSelectPersona: (persona: Persona) => void;
}

export const PersonaPopup = ({ isOpen, onClose, selectedPersonaId, onSelectPersona }: PersonaPopupProps) => {
  const handleSelect = (persona: Persona) => {
    onSelectPersona(persona);
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
            className="fixed inset-4 top-[10%] bottom-auto z-50 mx-auto max-w-md"
          >
            <GlassCard variant="strong" chromium className="p-4 border border-white/10 rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="font-medium text-foreground">Select Persona</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Persona grid - scrollable */}
              <div className="overflow-y-auto max-h-[60vh] pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2">
                  {PERSONAS.map((persona) => {
                    const Icon = persona.icon;
                    return (
                      <button
                        key={persona.id}
                        onClick={() => handleSelect(persona)}
                        className={`flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200 hover:scale-[1.01] ${
                          selectedPersonaId === persona.id
                            ? "bg-white/10 border border-white/20"
                            : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div className={`p-2 rounded-lg flex-shrink-0 ${
                          selectedPersonaId === persona.id ? "bg-white/20" : "bg-white/5"
                        }`}>
                          <Icon size={16} className="text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{persona.name}</p>
                            {selectedPersonaId === persona.id && (
                              <Check size={12} className="text-foreground flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{persona.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
