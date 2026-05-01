import { useState, useCallback, useRef } from "react";
import { streamMockResponse } from "@/utils/mockChat";
import { AttachedFile } from "@/components/FileAttachment";
import { useProviders } from "@/hooks/useProviders";
import type { ChatMessage, ContentPart } from "@/lib/providers";

interface Attachment {
  url: string;
  type: string;
  name: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

interface ChatSettings {
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
}

interface LocalChatOptions {
  onAddMessage?: (
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    attachments?: Attachment[]
  ) => { id: string };
  onUpdateMessage?: (conversationId: string, messageId: string, content: string) => void;
  onGetMessages?: (conversationId: string) => Message[];
  onRequestProviderSetup?: () => void;
}

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const buildContent = (text: string, atts: Attachment[]): string | ContentPart[] => {
  if (atts.length === 0) return text;
  const parts: ContentPart[] = [];
  if (text) parts.push({ type: "text", text });
  for (const a of atts) {
    if (a.type === "image") {
      parts.push({ type: "image_url", image_url: { url: a.url } });
    }
  }
  return parts.length > 0 ? parts : text;
};

export const useLocalChat = (
  conversationId: string | null,
  settings: ChatSettings,
  options: LocalChatOptions = {}
) => {
  const { onAddMessage, onGetMessages, onRequestProviderSetup } = options;
  const { activeProvider, activeSettings, isReady } = useProviders();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(
    (convId: string) => {
      if (onGetMessages) setMessages(onGetMessages(convId));
    },
    [onGetMessages]
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  const sendMessage = useCallback(
    async (content: string, convId: string, attachments?: AttachedFile[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return;
      if (isLoading) return;

      setIsLoading(true);

      // Process attachments → base64
      const processed: Attachment[] = [];
      if (attachments) {
        for (const att of attachments) {
          if (att.file.size > MAX_ATTACHMENT_BYTES) {
            console.warn("Attachment too large, skipping:", att.file.name);
            continue;
          }
          try {
            const dataUrl = await fileToDataUrl(att.file);
            processed.push({ url: dataUrl, type: att.type, name: att.file.name });
          } catch (e) {
            console.error("Attachment processing failed", e);
          }
        }
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        attachments: processed,
      };
      setMessages((prev) => [...prev, userMsg]);
      onAddMessage?.(convId, "user", content, processed);

      abortControllerRef.current = new AbortController();
      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

      let assistantContent = "";
      const onDelta = (delta: string) => {
        assistantContent += delta;
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, content: assistantContent } : m))
        );
      };

      try {
        if (isReady && activeProvider && activeSettings) {
          // Build provider message history from currently-rendered messages (excluding the empty assistant placeholder)
          const history: ChatMessage[] = [...messages, userMsg].map((m) => ({
            role: m.role,
            content: buildContent(m.content, m.attachments || []),
          }));

          await activeProvider.streamChat({
            apiKey: activeSettings.apiKey,
            baseUrl: activeSettings.baseUrl,
            model: activeSettings.model,
            messages: history,
            systemPrompt: settings.systemPrompt,
            temperature: settings.temperature,
            topP: settings.topP,
            maxTokens: settings.maxTokens,
            signal: abortControllerRef.current.signal,
            onDelta,
          });

          if (assistantContent) {
            onAddMessage?.(convId, "assistant", assistantContent);
          }
        } else {
          // Demo mode — no provider configured
          await streamMockResponse(
            onDelta,
            () => {
              if (assistantContent) onAddMessage?.(convId, "assistant", assistantContent);
            },
            abortControllerRef.current.signal
          );
          // Nudge user to set up
          onRequestProviderSetup?.();
        }
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Chat error:", error);
          const errMsg = `**Connection error**\n\n${error?.message || "Failed to reach the model"}.\n\nCheck your API key, model name, and network — then try again.`;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: errMsg } : m))
          );
          onAddMessage?.(convId, "assistant", errMsg);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      isLoading,
      messages,
      onAddMessage,
      isReady,
      activeProvider,
      activeSettings,
      settings.systemPrompt,
      settings.temperature,
      settings.topP,
      settings.maxTokens,
      onRequestProviderSetup,
    ]
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, stopGeneration, loadMessages, clearMessages };
};
