import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Square, Cpu, Sparkles } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { getPersonaById } from "@/data/personas";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  selectedModel: string;
  selectedPersonaId: string;
  onOpenModelPopup: () => void;
  onOpenPersonaPopup: () => void;
}

export const ChatInput = ({
  onSend,
  onStop,
  isLoading,
  selectedModel,
  selectedPersonaId,
  onOpenModelPopup,
  onOpenPersonaPopup,
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const persona = getPersonaById(selectedPersonaId);
  const PersonaIcon = persona.icon;

  // Get short model name
  const getModelDisplayName = (modelId: string) => {
    const parts = modelId.split('/');
    const name = parts[parts.length - 1];
    return name.replace(/-preview$/, '').replace('gemini-', 'G').replace('gpt-', 'GPT-');
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <GlassCard variant="strong" chromium className="p-2">
        {/* Selection chips */}
        <div className="flex items-center gap-2 px-2 pb-2 border-b border-white/5 mb-2">
          <button
            onClick={onOpenModelPopup}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <Cpu size={12} />
            <span>{getModelDisplayName(selectedModel)}</span>
          </button>
          <button
            onClick={onOpenPersonaPopup}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-muted-foreground hover:text-foreground transition-all"
          >
            <PersonaIcon size={12} />
            <span>{persona.name}</span>
          </button>
        </div>

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Enma..."
            className="flex-1 bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground/50 py-2 px-2 min-h-[40px] max-h-[200px]"
            rows={1}
          />

          {isLoading ? (
            <button
              onClick={onStop}
              className="p-2.5 rounded-lg bg-white/10 text-foreground hover:bg-white/20 transition-all"
              title="Stop generating"
            >
              <Square size={18} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={`p-2.5 rounded-lg transition-all ${
                input.trim()
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed"
              }`}
              title="Send message"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </GlassCard>
      <p className="text-xs text-muted-foreground/40 text-center mt-2">
        Enma can make mistakes. Consider checking important information.
      </p>
    </motion.div>
  );
};
