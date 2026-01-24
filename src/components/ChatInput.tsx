import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Cpu, Paperclip, Upload } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { getPersonaById } from "@/data/personas";
import { FileAttachment, AttachedFile } from "./FileAttachment";
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
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const persona = getPersonaById(selectedPersonaId);
  const PersonaIcon = persona.icon;

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
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the drop zone entirely
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

  // Paste handler for images
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
              className="absolute inset-0 z-10 rounded-2xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2 text-primary">
                <Upload size={32} />
                <p className="text-sm font-medium">Drop files here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GlassCard variant="strong" chromium className="p-3">
          {/* Attachments preview */}
          <FileAttachment files={attachments} onRemove={handleRemoveAttachment} />

          {/* Selection chips */}
          <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/5 mb-2">
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
            
            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-muted-foreground hover:text-foreground transition-all ml-auto"
              title="Attach files (or drag & drop)"
            >
              <Paperclip size={12} />
              <span className="hidden sm:inline">Attach</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Enma... (paste images or drag files)"
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
                disabled={!input.trim() && attachments.length === 0}
                className={`p-2.5 rounded-lg transition-all ${
                  input.trim() || attachments.length > 0
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
      </div>
      <p className="text-xs text-muted-foreground/40 text-center mt-2">
        Enma can make mistakes. Consider checking important information.
      </p>
    </motion.div>
  );
};
