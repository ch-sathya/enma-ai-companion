import { X, FileText, Image as ImageIcon, File } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface AttachedFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'pdf' | 'document' | 'text';
}

interface FileAttachmentProps {
  files: AttachedFile[];
  onRemove: (id: string) => void;
}

const getFileIcon = (type: AttachedFile['type']) => {
  switch (type) {
    case 'image':
      return ImageIcon;
    case 'pdf':
      return FileText;
    case 'text':
      return FileText;
    default:
      return File;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileAttachment = ({ files, onRemove }: FileAttachmentProps) => {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 pb-2">
      <AnimatePresence mode="popLayout">
        {files.map((file) => {
          const Icon = getFileIcon(file.type);
          
          return (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative group flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 max-w-[200px]"
            >
              {/* Preview or Icon */}
              {file.type === 'image' && file.preview ? (
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                  <Icon size={16} className="text-muted-foreground" />
                </div>
              )}
              
              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{file.file.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatFileSize(file.file.size)}
                </p>
              </div>
              
              {/* Remove button */}
              <button
                onClick={() => onRemove(file.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
              >
                <X size={10} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
