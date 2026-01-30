import { useState, useCallback, useRef } from "react";
import { streamMockResponse } from "@/utils/mockChat";
import { AttachedFile } from "@/components/FileAttachment";

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
}

export const useLocalChat = (
  conversationId: string | null,
  settings: ChatSettings,
  options: LocalChatOptions = {}
) => {
  const { onAddMessage, onUpdateMessage, onGetMessages } = options;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(
    (convId: string) => {
      if (onGetMessages) {
        const loaded = onGetMessages(convId);
        setMessages(loaded);
      }
    },
    [onGetMessages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Convert file to base64 data URL for local storage
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const sendMessage = useCallback(
    async (content: string, convId: string, attachments?: AttachedFile[]) => {
      if (!content.trim() && (!attachments || attachments.length === 0)) return;
      if (isLoading) return;

      setIsLoading(true);

      // Process attachments locally (convert to base64)
      let processedAttachments: Attachment[] = [];
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          try {
            const dataUrl = await fileToDataUrl(att.file);
            processedAttachments.push({
              url: dataUrl,
              type: att.type,
              name: att.file.name,
            });
          } catch (error) {
            console.error("Failed to process attachment:", error);
          }
        }
      }

      // Add user message
      const userMsgId = crypto.randomUUID();
      const userMsg: Message = {
        id: userMsgId,
        role: "user",
        content,
        attachments: processedAttachments,
      };
      setMessages((prev) => [...prev, userMsg]);

      // Save to local storage if handler provided
      if (onAddMessage) {
        onAddMessage(convId, "user", content, processedAttachments);
      }

      // Create abort controller
      abortControllerRef.current = new AbortController();

      // Add empty assistant message for streaming
      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "" },
      ]);

      let assistantContent = "";

      try {
        await streamMockResponse(
          (chunk) => {
            assistantContent += chunk;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: assistantContent } : m
              )
            );
          },
          () => {
            // Save assistant message to local storage
            if (onAddMessage) {
              onAddMessage(convId, "assistant", assistantContent);
            }
          },
          abortControllerRef.current.signal
        );
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Chat error:", error);
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== assistantMsgId),
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `Error: ${error.message || "Failed to get response"}`,
            },
          ]);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, onAddMessage]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    stopGeneration,
    loadMessages,
    clearMessages,
  };
};
