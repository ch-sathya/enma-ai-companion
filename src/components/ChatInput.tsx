import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Paperclip, Upload, Mic, MicOff, Settings2 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { FileAttachment, AttachedFile } from "./FileAttachment";
import { SoundWaveAnimation } from "./SoundWaveAnimation";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.txt,.md";
const ACCEPTED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'text/markdown'
];

const getFileType = (file: File): AttachedFile['type'] => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.includes('text') || file.name.endsWith('.md') || file.name.endsWith('.txt')) return 'text';
  return 'document';
};

const isValidFileType = (file: File): boolean => {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '');
};

interface ChatInputProps {
  onSend: (message: string, attachments?: AttachedFile[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  selectedModel: string;
  selectedPersonaId: string;
  onOpenModelPopup: () => void;
  onOpenPersonaPopup: () => void;
  // Voice props
  isListening?: boolean;
  isSpeaking?: boolean;
  isVoiceSupported?: boolean;
  onVoiceToggle?: () => void;
  onStopSpeaking?: () => void;
}

export const ChatInput = ({
  onSend,
  onStop,
  isLoading,
  selectedModel,
  selectedPersonaId,
  onOpenModelPopup,
  onOpenPersonaPopup,
  isListening = false,
  isSpeaking = false,
  isVoiceSupported = false,
  onVoiceToggle,
  onStopSpeaking,
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const processFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      if (!isValidFileType(file)) {
        toast.error(`${file.name} is not a supported file type.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Max size is 10MB.`);
        continue;
      }

      const type = getFileType(file);
      let preview: string | undefined;

      if (type === 'image') {
        preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      setAttachments(prev => [...prev, {
        id: crypto.randomUUID(),
        file,
        preview,
        type,
      }]);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node;
    if (!dropZoneRef.current?.contains(relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
    }
  }, [processFiles]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
      
      if (imageItems.length > 0) {
        e.preventDefault();
        const files: File[] = [];
        
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
        
        if (files.length > 0) {
          await processFiles(files);
          toast.success(`${files.length} image${files.length > 1 ? 's' : ''} pasted`);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processFiles]);

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSend(input.trim(), attachments.length > 0 ? attachments : undefined);
    setInput("");
    setAttachments([]);
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
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="relative"
      >
        {/* Drop zone overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 rounded-2xl border-2 border-dashed border-foreground/30 bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2 text-foreground/70">
                <Upload size={28} />
                <p className="text-sm font-medium">Drop files here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GlassCard 
          variant="clean" 
          className={`rounded-2xl transition-all duration-200 ${isFocused ? 'border-white/20' : ''}`}
        >
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="px-3 pt-3">
              <FileAttachment files={attachments} onRemove={handleRemoveAttachment} />
            </div>
          )}

          {/* Single row input */}
          <div className="flex items-end gap-2 p-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Message Enma..."
              className="flex-1 bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground/40 py-2 min-h-[40px] max-h-[200px]"
              rows={1}
            />

            {/* Action buttons - right side */}
            <div className="flex items-center gap-1">
              {/* Settings button - opens model/persona */}
              <button
                onClick={onOpenModelPopup}
                className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-all"
                title="Model settings"
              >
                <Settings2 size={18} />
              </button>

              {/* Attach button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-white/5 transition-all"
                title="Attach files"
              >
                <Paperclip size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Voice button */}
              {isVoiceSupported && onVoiceToggle && (
                <div className="flex items-center">
                  <AnimatePresence>
                    {isListening && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="overflow-hidden"
                      >
                        <SoundWaveAnimation isActive={isListening} barCount={4} className="px-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={isSpeaking ? onStopSpeaking : onVoiceToggle}
                    className={`p-2 rounded-lg transition-all ${
                      isListening 
                        ? "text-foreground bg-white/10" 
                        : isSpeaking
                        ? "text-foreground bg-white/10"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                    }`}
                    title={isListening ? "Stop listening" : isSpeaking ? "Stop speaking" : "Voice input"}
                  >
                    {isSpeaking ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>
              )}

              {/* Send/Stop button */}
              {isLoading ? (
                <button
                  onClick={onStop}
                  className="p-2 rounded-lg bg-white/10 text-foreground hover:bg-white/15 transition-all"
                  title="Stop generating"
                >
                  <Square size={18} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() && attachments.length === 0}
                  className={`p-2 rounded-lg transition-all ${
                    input.trim() || attachments.length > 0
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-white/5 text-muted-foreground/30 cursor-not-allowed"
                  }`}
                  title="Send message"
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
      <p className="text-xs text-muted-foreground/30 text-center mt-3">
        Enma can make mistakes. Consider checking important information.
      </p>
    </motion.div>
  );
};
