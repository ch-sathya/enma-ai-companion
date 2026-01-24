import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Square, Settings2 } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  onOpenSettings?: () => void;
}

export const ChatInput = ({ onSend, onStop, isLoading, onOpenSettings }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        <div className="flex items-end gap-2">
          <button
            onClick={onOpenSettings}
            className="p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            title="Model Settings"
          >
            <Settings2 size={20} />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Enma..."
            className="flex-1 bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground/50 py-3 px-2 min-h-[48px] max-h-[200px]"
            rows={1}
          />

          {isLoading ? (
            <button
              onClick={onStop}
              className="p-3 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-all"
              title="Stop generating"
            >
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className={`p-3 rounded-lg transition-all ${
                input.trim()
                  ? "bg-primary text-primary-foreground hover:brightness-110"
                  : "bg-white/5 text-muted-foreground cursor-not-allowed"
              }`}
              title="Send message"
            >
              <Send size={20} />
            </button>
          )}
        </div>
      </GlassCard>
      <p className="text-xs text-muted-foreground/50 text-center mt-2">
        Enma can make mistakes. Consider checking important information.
      </p>
    </motion.div>
  );
};
