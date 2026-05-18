import { memo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, User, RefreshCw, Pencil, FileText, File } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import enmaKatanaLogo from "@/assets/enma-katana-logo.png";
import { useTransparentImage } from "@/hooks/useTransparentImage";

interface Attachment {
  url: string;
  type: string;
  name: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEdit?: () => void;
}

const ChatMessageComponent = ({ 
  role, 
  content, 
  attachments,
  isStreaming, 
  onRegenerate, 
  onEdit 
}: ChatMessageProps) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const assistantLogoSrc = useTransparentImage(enmaKatanaLogo);

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isUser = role === "user";

  const renderAttachments = () => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-2">
        {attachments.map((att, index) => (
          <div key={index}>
            {att.type === "image" ? (
              <a href={att.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={att.url}
                  alt={att.name}
                  className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-white/10 hover:border-white/20 transition-colors"
                />
              </a>
            ) : (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                {att.type === "pdf" ? (
                  <FileText size={16} className="text-muted-foreground" />
                ) : (
                  <File size={16} className="text-muted-foreground" />
                )}
                <span className="text-sm text-foreground truncate max-w-[150px]">
                  {att.name}
                </span>
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">
          <User size={16} />
        </div>
      ) : (
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-border/40 bg-transparent overflow-hidden">
          <img
            src={assistantLogoSrc}
            alt="Enma"
            className="w-full h-full object-cover scale-150"
          />
        </div>
      )}

      {/* Message content */}
      <div className={cn("flex-1 max-w-[80%]", isUser ? "flex flex-col items-end" : "")}>
        {/* Attachments */}
        {renderAttachments()}

        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "glass-strong rounded-br-md text-foreground"
              : "glass-subtle rounded-bl-md"
          )}
        >
          {isStreaming && !content ? (
            <div className="flex gap-1.5 py-2">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    
                    if (match) {
                      return (
                        <div className="relative my-4 code-block">
                          <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                            <span className="text-xs text-muted-foreground font-mono">
                              {match[1]}
                            </span>
                            <button
                              onClick={() => copyToClipboard(codeString)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedCode === codeString ? (
                                <Check size={14} className="text-emerald-400" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              background: "transparent",
                              padding: "1rem",
                            }}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }

                    return (
                      <code
                        className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-primary"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
              {isStreaming && content && (
                <span
                  aria-hidden
                  className="inline-block w-[6px] h-[1.05em] -mb-[2px] ml-0.5 align-middle rounded-[1px] bg-[hsl(var(--enma-purple-glow))] animate-pulse shadow-[0_0_10px_hsl(var(--enma-purple-glow)/0.6)]"
                />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isStreaming && content && (
          <div
            className={cn(
              "flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            {!isUser && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                title="Regenerate"
              >
                <RefreshCw size={14} />
              </button>
            )}
            {isUser && onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                title="Edit"
              >
                <Pencil size={14} />
              </button>
            )}
            <button
              onClick={() => copyToClipboard(content)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
              title="Copy"
            >
            {copiedCode === content ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
                <Copy size={14} />
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Memoize to prevent unnecessary re-renders during streaming
export const ChatMessage = memo(ChatMessageComponent);